# PackVote

Group trips stall because everyone wants something different. PackVote collects each traveller's
preferences separately and recommends Indian destinations the **whole group** can live with, not
just the average of the group. Then it writes a day-by-day itinerary for the destination you pick.

## How it works

1. **Create a trip.** The organiser enters the trip length, budget range and the participants'
   email addresses.
2. **Everyone fills in a private form.** Each participant gets a link with a unique token (sent by
   SendGrid, or logged to the console in mock mode). They set their budget, preferred climate,
   trip vibes, activity level, culture/nature balance, accessibility needs, places to avoid and
   how much budget, weather, activities and vibe matter to them.
3. **Recommendations.** The scorer (`backend/app/scoring.py`) ranks 95 Indian destinations from
   `backend/data/india_destinations.json`:
   - **Hard constraints** drop destinations above the lowest budget ceiling, places anyone wants
     to avoid, and trips that need more days than you have.
   - **Soft scores** for budget fit, climate (majority vote), vibe match (cosine similarity
     between the group's vibe vector and the destination's) and activity level, weighted by the
     group's averaged weights.
   - **Fairness:** every participant gets an individual satisfaction score. The final score is
     70% of the group score plus 30% of the *least satisfied* member's score, destinations where
     anyone falls below 30% are penalised, and high disagreement is flagged.
   - **Diversity:** the top five mix categories (beach, mountains, heritage, wildlife) where
     possible.
4. **Itinerary.** For the chosen destination, Google Gemini (`gemini-2.5-flash`) writes a
   day-by-day plan using a 7-day forecast from Open-Meteo. Without a Gemini key, a template
   itinerary is used instead. An optional travel-time estimate uses the Google Maps Distance
   Matrix API.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, PostgreSQL, JWT auth (PyJWT, passlib/bcrypt) |
| Scoring | Pure Python: cosine similarity, weighted scoring, least-misery fairness |
| AI | Google Gemini API (`google-generativeai`) |
| External APIs | Open-Meteo (weather), Google Maps Distance Matrix (optional), SendGrid (optional) |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Infra | Docker Compose (PostgreSQL + backend) |

## Run locally

**1. Environment.** Create `.env` in the repository root:

```
DATABASE_URL=postgresql://postgres:postgres@db:5432/packvote
SECRET_KEY=change-me-to-a-long-random-string
GEMINI_API_KEY=            # optional: without it, itineraries use the template
GOOGLE_MAPS_API_KEY=       # optional: travel-time estimate
SENDGRID_API_KEY=          # optional: without it, emails are logged instead of sent
FROM_EMAIL=you@example.com
FRONTEND_URL=http://localhost:3000
```

`DATABASE_URL` must point at the `db` service when the backend runs in Docker. If you run the
backend directly on your machine, use `localhost` instead of `db`.

**2. Backend and database.**

```bash
docker compose up --build
```

The API runs on <http://localhost:8000>; `GET /health` should return `{"status": "ok"}`, and
interactive docs are at <http://localhost:8000/docs>.

**3. Frontend.**

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>. The Vite dev server forwards `/api` requests to the backend.

## Repository layout

```
backend/app/main.py        FastAPI routes: auth, trips, preference forms, recommendations, itinerary
backend/app/scoring.py     destination scoring, fairness and diversity
backend/app/models.py      SQLAlchemy models (User, Trip, Participant)
backend/data/              95 destinations with cost, climate, vibes, activities and coordinates
frontend/src/              React pages, components and API clients
scrape_holidify.py         one-off scraper used to collect raw destination data
test_flow.py               manual end-to-end script against a running backend
test_travel.py             manual check of the travel-estimate endpoint
```

## Research

The system is described in a co-authored IEEE-format paper.

## Author

Shaik Shahid Hussain · [GitHub](https://github.com/sha728) · [LinkedIn](https://www.linkedin.com/in/shahid-s/)
