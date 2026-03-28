# backend/app/main.py
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
import json
import requests
from dotenv import load_dotenv

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

from .database import get_db, init_db
from .models import Trip, Participant, TripStatus
from .scoring import DestinationScorer, generate_explanation
from .email_service import EmailService

load_dotenv()

import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="PackVote API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# ==================== WEATHER & GEMINI HELPERS ====================

def get_weather_forecast(lat, lon, api_key=None):
    """Get 7-day weather forecast from Open-Meteo (free, no API key needed)."""
    
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto"
    
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        daily = data.get('daily', {})
        dates = daily.get('time', [])
        max_temps = daily.get('temperature_2m_max', [])
        min_temps = daily.get('temperature_2m_min', [])
        precip = daily.get('precipitation_sum', [])
        codes = daily.get('weathercode', [])
        
        result = {}
        for i, date in enumerate(dates[:7]):
            code = codes[i] if i < len(codes) else 0
            condition = interpret_weather_code(code)
            
            result[date] = {
                'max_temp': max_temps[i] if i < len(max_temps) else None,
                'min_temp': min_temps[i] if i < len(min_temps) else None,
                'precipitation': precip[i] if i < len(precip) else 0,
                'condition': condition,
                'rain_chance': 'High' if (precip[i] if i < len(precip) else 0) > 5 else 'Low'
            }
        return result
    except Exception as e:
        print(f"Weather API error: {e}")
        return None

def interpret_weather_code(code):
    """Convert WMO weather code to readable condition."""
    if code == 0:
        return "Clear sky"
    elif code in [1, 2, 3]:
        return "Partly cloudy"
    elif code in [45, 48]:
        return "Foggy"
    elif code in [51, 53, 55]:
        return "Drizzle"
    elif code in [61, 63, 65]:
        return "Rain"
    elif code in [71, 73, 75]:
        return "Snow"
    elif code in [95, 96, 99]:
        return "Thunderstorm"
    else:
        return "Cloudy"


def generate_gemini_itinerary(destination, days, weather_data, group_preferences):
    """Generate AI itinerary using Gemini."""
    import os
    gemini_api_key = os.getenv("GEMINI_API_KEY", "")
    
    # Force debug output
    import sys
    sys.stderr.write(f"\n\n=== GEMINI DEBUG ===\n")
    sys.stderr.write(f"Key present: {bool(gemini_api_key)}\n")
    sys.stderr.write(f"Key length: {len(gemini_api_key)}\n")
    sys.stderr.write(f"Key first 10 chars: {gemini_api_key[:10]}...\n")
    sys.stderr.write(f"GEMINI_AVAILABLE: {GEMINI_AVAILABLE}\n")
    sys.stderr.write(f"=== END DEBUG ===\n\n")
    sys.stderr.flush()
    
    if not gemini_api_key:
        return None
    
    if not GEMINI_AVAILABLE:
        return None
    
    try:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        weather_summary = ""
        if weather_data:
            weather_summary = "Weather forecast:\n"
            for date, info in list(weather_data.items())[:days]:
                weather_summary += f"- {date}: Max {info['max_temp']}°C, Min {info['min_temp']}°C, {info['condition']}, Rain: {info['rain_chance']}\n"
        
        prompt = f"""
        Create a detailed {days}-day travel itinerary for {destination['name']}, {destination['state']}, India.
        
        Destination info:
        - Vibes: {', '.join(destination['vibes'])}
        - Activities available: {', '.join(destination['activities'])}
        - Best time: {destination['best_time']}
        
        {weather_summary}
        
        Create a day-by-day plan. Return ONLY this JSON format:
        {{
            "overview": "brief 2-sentence summary",
            "daily_plan": [
                {{
                    "day": 1,
                    "theme": "e.g., Arrival & Local Culture",
                    "morning": "specific activity with location",
                    "afternoon": "specific activity",
                    "evening": "specific activity",
                    "meals": ["breakfast: where/what", "lunch: where/what", "dinner: where/what"],
                    "weather_note": "adjustment based on forecast"
                }}
            ],
            "packing_tips": ["item1", "item2", "item3"],
            "local_food_to_try": ["dish1", "dish2", "dish3"],
            "travel_tips": ["tip1", "tip2"]
        }}
        
        Only return valid JSON, no markdown, no code blocks.
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up response
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        text = text.strip()
        
        return json.loads(text)
    except Exception as e:
        print(f"Gemini error: {e}")
        return None

def generate_basic_itinerary(destination: dict, days: int) -> dict:
    """Fallback basic itinerary."""
    activities = destination.get('activities', [])
    
    daily_plan = []
    for day in range(1, days + 1):
        day_activities = activities[(day-1)*2 : (day-1)*2 + 2] or ["Explore local area", "Try local cuisine"]
        
        daily_plan.append({
            "day": day,
            "theme": "Exploration" if day % 2 == 1 else "Relaxation",
            "morning": day_activities[0] if len(day_activities) > 0 else "Local sightseeing",
            "afternoon": day_activities[1] if len(day_activities) > 1 else "Leisure time",
            "evening": "Dinner and rest",
            "meals": ["Breakfast at hotel", "Lunch at local restaurant", "Dinner: Local specialty"],
            "weather_note": "Check forecast for adjustments"
        })
    
    return {
        "overview": f"A {days}-day trip to {destination['name']} featuring {', '.join(destination['vibes'][:2])}.",
        "daily_plan": daily_plan,
        "packing_tips": ["Comfortable walking shoes", "Weather-appropriate clothing", "Camera", "Sunscreen"],
        "local_food_to_try": ["Local specialty", "Street food", "Traditional thali"],
        "travel_tips": ["Book accommodations in advance", "Carry cash for small vendors"]
    }

# ==================== TRIP ENDPOINTS ====================

@app.post("/api/trips")
def create_trip(
    name: str,
    creator_email: str,
    creator_name: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    duration_days: int = 3,
    budget_min: float = 2000,
    budget_max: float = 5000,
    participant_emails: List[str] = Query([]),
    db: Session = Depends(get_db)
):
    """Create a new trip and add participants."""
    
    start_date = datetime.fromisoformat(date_start) if date_start else datetime.now() + timedelta(days=30)
    end_date = datetime.fromisoformat(date_end) if date_end else start_date + timedelta(days=duration_days)
    
    trip = Trip(
        name=name,
        creator_email=creator_email,
        creator_name=creator_name,
        date_start=start_date,
        date_end=end_date,
        duration_days=duration_days,
        budget_min=budget_min,
        budget_max=budget_max,
        status=TripStatus.FORMS_SENT
    )
    db.add(trip)
    db.flush()
    
    email_service = EmailService()
    participants_added = []
    
    creator = Participant(
        trip_id=trip.id,
        email=creator_email,
        name=creator_name,
        form_token=str(uuid.uuid4()),
        budget_ceiling=budget_max,
        budget_floor=budget_min
    )
    db.add(creator)
    participants_added.append(creator)
    
    for email in participant_emails:
        if email != creator_email:
            participant = Participant(
                trip_id=trip.id,
                email=email,
                form_token=str(uuid.uuid4()),
                budget_ceiling=budget_max,
                budget_floor=budget_min
            )
            db.add(participant)
            participants_added.append(participant)
    
    db.commit()
    
    for p in participants_added:
        email_service.send_preference_form(p, trip)
    
    return {
        "trip_id": str(trip.id),
        "name": trip.name,
        "participants_added": len(participants_added),
        "status": trip.status.value,
        "message": "Trip created! Emails sent to all participants."
    }

@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: str, db: Session = Depends(get_db)):
    """Get trip details."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    participants = db.query(Participant).filter(Participant.trip_id == trip_id).all()
    
    return {
        "id": str(trip.id),
        "name": trip.name,
        "status": trip.status.value,
        "dates": {
            "start": trip.date_start.isoformat() if trip.date_start else None,
            "end": trip.date_end.isoformat() if trip.date_end else None,
            "duration": trip.duration_days
        },
        "budget": {"min": trip.budget_min, "max": trip.budget_max},
        "participants": [
            {
                "id": str(p.id),
                "email": p.email,
                "name": p.name,
                "form_completed": p.form_completed,
                "form_token": p.form_token
            }
            for p in participants
        ],
        "recommendations": trip.recommendations,
        "selected_destination": trip.selected_destination
    }

# ==================== FORM ENDPOINTS ====================

@app.get("/api/form-context/{token}")
def get_form_context(token: str, db: Session = Depends(get_db)):
    """Get trip info for the preference form."""
    participant = db.query(Participant).filter(Participant.form_token == token).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Invalid form link")
    
    trip = db.query(Trip).filter(Trip.id == participant.trip_id).first()
    
    return {
        "trip_name": trip.name,
        "trip_id": str(trip.id),
        "participant_email": participant.email,
        "dates": {
            "start": trip.date_start.strftime("%B %d") if trip.date_start else None,
            "end": trip.date_end.strftime("%B %d, %Y") if trip.date_end else None
        },
        "duration": trip.duration_days,
        "budget_min": trip.budget_min,
        "budget_max": trip.budget_max,
        "already_completed": participant.form_completed
    }

@app.post("/api/submit-preferences/{token}")
def submit_preferences(
    token: str,
    budget_ceiling: float,
    budget_floor: float,
    climate: str,
    activity_level: float,
    culture_nature: float,
    date_flexibility: int = 0,
    avoided_destinations: List[str] = [],
    required_vibes: List[str] = [],
    avoided_vibes: List[str] = [],
    accessibility_needs: List[str] = [],
    food_importance: float = 0.5,
    nightlife_importance: float = 0.5,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Submit preferences from the form."""
    
    participant = db.query(Participant).filter(Participant.form_token == token).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Invalid form link")
    
    if participant.form_completed:
        raise HTTPException(status_code=400, detail="Form already submitted")
    
    participant.budget_ceiling = budget_ceiling
    participant.budget_floor = budget_floor
    participant.date_flexibility_days = date_flexibility
    participant.avoided_destinations = avoided_destinations
    participant.required_vibes = required_vibes
    participant.avoided_vibes = avoided_vibes
    participant.accessibility_needs = accessibility_needs
    participant.climate_preference = climate
    participant.activity_level = activity_level
    participant.culture_nature_balance = culture_nature
    participant.food_importance = food_importance
    participant.nightlife_importance = nightlife_importance
    participant.weights = {"budget": 0.25, "weather": 0.25, "activities": 0.25, "vibe": 0.25}
    participant.form_completed = True
    participant.form_completed_at = datetime.utcnow()
    
    db.commit()
    
    all_completed = db.query(Participant).filter(
        Participant.trip_id == participant.trip_id,
        Participant.form_completed == False
    ).count() == 0
    
    if all_completed:
        trip = db.query(Trip).filter(Trip.id == participant.trip_id).first()
        trip.status = TripStatus.GENERATING
        db.commit()
        
        if background_tasks:
            background_tasks.add_task(generate_recommendations_task, str(participant.trip_id))
        else:
            generate_recommendations_task(str(participant.trip_id))
    
    return {"status": "success", "message": "Preferences saved!"}

def generate_recommendations_task(trip_id: str):
    """Background task to generate recommendations."""
    import logging
    logger = logging.getLogger(__name__)
    from .database import SessionLocal
    db = SessionLocal()
    try:
        logger.info(f"[RECS] Starting recommendation generation for trip {trip_id}")

        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            logger.error(f"[RECS] Trip {trip_id} not found in DB")
            return

        participants = db.query(Participant).filter(Participant.trip_id == trip_id).all()
        logger.info(f"[RECS] Found {len(participants)} participants")

        scorer = DestinationScorer()
        scored = scorer.score_destinations(participants, trip)
        logger.info(f"[RECS] Scored {len(scored)} destinations")

        recommendations = []
        for result in scored:
            explanation = generate_explanation(result, participants)
            recommendations.append({
                "destination": result['destination'],
                "score": result['total_score'],
                "basic_score": result.get('basic_score'),
                "fairness": result.get('fairness'),
                "breakdown": result['breakdown'],
                "explanation": explanation,
                "conflict_warning": result.get('conflict_warning'),
                "category": result.get('category')
            })

        # Bug Fix #2: flag_modified forces SQLAlchemy to detect the JSON column change
        trip.recommendations = recommendations
        flag_modified(trip, "recommendations")
        trip.status = TripStatus.VOTING
        db.commit()
        logger.info(f"[RECS] Saved {len(recommendations)} recommendations for trip {trip_id}, status=VOTING")

        email_service = EmailService()
        for p in participants:
            try:
                email_service.send_results_ready(p, trip)
            except Exception as email_err:
                logger.warning(f"[RECS] Failed to send results email to {p.email}: {email_err}")

    except Exception as e:
        # Bug Fix #1: catch and log — previously this was silently swallowed
        logger.error(f"[RECS] generate_recommendations_task FAILED for trip {trip_id}: {e}", exc_info=True)
        try:
            # Mark trip as failed so the frontend can stop polling
            trip = db.query(Trip).filter(Trip.id == trip_id).first()
            if trip and trip.status == TripStatus.GENERATING:
                trip.status = TripStatus.FORMS_SENT  # revert so user can retry
                db.commit()
        except Exception:
            pass
    finally:
        db.close()

@app.get("/api/trips/{trip_id}/recommendations")
def get_recommendations(trip_id: str, db: Session = Depends(get_db)):
    """Get generated recommendations."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Bug Fix #3: check trip.status rather than truthiness of the list.
    # trip.recommendations = [] is valid (generated but no matches);
    # only statuses VOTING / SELECTED / ITINERARY_GENERATED / COMPLETED mean
    # the generation run has finished.
    ready_statuses = {
        TripStatus.VOTING,
        TripStatus.SELECTED,
        TripStatus.ITINERARY_GENERATED,
        TripStatus.COMPLETED,
    }
    if trip.status not in ready_statuses:
        raise HTTPException(status_code=400, detail="Recommendations not ready yet")

    return {
        "trip_name": trip.name,
        "recommendations": trip.recommendations or [],
        "participants_completed": sum(1 for p in trip.participants if p.form_completed),
        "total_participants": len(trip.participants)
    }

@app.post("/api/trips/{trip_id}/select-destination")
def select_destination(trip_id: str, destination_name: str, db: Session = Depends(get_db)):
    """Group selects a destination."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    selected = None
    for rec in trip.recommendations or []:
        if rec['destination']['name'] == destination_name:
            selected = rec['destination']
            break
    
    if not selected:
        from .scoring import DESTINATIONS
        for dest in DESTINATIONS:
            if dest['name'] == destination_name:
                selected = dest
                break
    
    if not selected:
        raise HTTPException(status_code=404, detail="Destination not found")
    
    trip.selected_destination = selected
    trip.status = TripStatus.SELECTED
    db.commit()
    
    return {
        "status": "success",
        "selected": selected['name'],
        "message": f"Selected {selected['name']}! Itinerary generation coming next."
    }

@app.get("/api/trips/{trip_id}/itinerary")
def get_itinerary(trip_id: str, force: bool = False, db: Session = Depends(get_db)):
    import sys
    sys.stderr.write(f"\n\n=== ITINERARY DEBUG ===\n")
    sys.stderr.write(f"Trip ID: {trip_id}\n")
    sys.stderr.write(f"Force: {force}\n")
    sys.stderr.flush()
    
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    sys.stderr.write(f"Trip found: {trip.name}\n")
    sys.stderr.write(f"Has selected_destination: {trip.selected_destination is not None}\n")
    sys.stderr.write(f"Existing itinerary: {trip.itinerary is not None}\n")
    sys.stderr.flush()
    
    if not trip.selected_destination:
        raise HTTPException(status_code=400, detail="No destination selected yet")
    
    if trip.itinerary and not force:
        sys.stderr.write("Returning cached itinerary\n")
        sys.stderr.flush()
        return trip.itinerary
    
    sys.stderr.write("Generating new itinerary...\n")
    sys.stderr.flush()
    
    dest = trip.selected_destination
    sys.stderr.write(f"Destination: {dest['name']}\n")
    sys.stderr.flush()
    
    # Get weather
    sys.stderr.write("Getting weather...\n")
    sys.stderr.flush()
    weather = get_weather_forecast(dest['lat'], dest['lon'])
    sys.stderr.write(f"Weather data present: {weather is not None}\n")
    sys.stderr.flush()
    
    # Try Gemini
    sys.stderr.write("Calling Gemini function...\n")
    sys.stderr.flush()
    gemini_result = generate_gemini_itinerary(dest, trip.duration_days, weather, {})
    sys.stderr.write(f"Gemini result present: {gemini_result is not None}\n")
    sys.stderr.flush()
    
    if gemini_result:
        sys.stderr.write("Using Gemini itinerary\n")
        sys.stderr.flush()
        itinerary = {
            "destination": dest['name'],
            "generated_by": "gemini",
            "weather_data": weather,
            "itinerary": gemini_result
        }
    else:
        sys.stderr.write("Using template fallback\n")
        sys.stderr.flush()
        basic = generate_basic_itinerary(dest, trip.duration_days)
        itinerary = {
            "destination": dest['name'],
            "generated_by": "template",
            "weather_data": weather,
            "itinerary": basic
        }
    
    trip.itinerary = itinerary
    trip.status = TripStatus.ITINERARY_GENERATED
    db.commit()
    
    sys.stderr.write(f"=== END DEBUG ===\n\n")
    sys.stderr.flush()
    
    return itinerary

@app.get("/api/trips/{trip_id}/travel-estimate")
def get_travel_estimate(trip_id: str, origin: str, db: Session = Depends(get_db)):
    """Get heuristic travel cost estimation using Google Maps."""
    import requests
    import os
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip or not trip.selected_destination:
        raise HTTPException(status_code=400, detail="Trip not found or destination not selected")
    
    dest_name = trip.selected_destination['name']
    dest_state = trip.selected_destination.get('state', '')
    destination = f"{dest_name}, {dest_state}, India"
    
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Google Maps API key not configured")
        
    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={destination}&key={api_key}"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()
        
        if data['status'] == 'OK' and data['rows'][0]['elements'][0]['status'] == 'OK':
            distance_meters = data['rows'][0]['elements'][0]['distance']['value']
            distance_km = distance_meters / 1000.0
            
            return {
                "distance_km": round(distance_km, 2),
                "costs": {
                    "train": round(distance_km * 1.0, 2),
                    "bus": round(distance_km * 2.0, 2),
                    "flight": round(distance_km * 4.0, 2)
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Could not calculate distance. Check the origin city.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/debug/env")
def debug_env():
    import os
    return {
        "gemini_key_present": bool(os.getenv("GEMINI_API_KEY")),
        "gemini_key_length": len(os.getenv("GEMINI_API_KEY", "")),
        "all_env_vars": list(os.environ.keys())
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "packvote-api"}