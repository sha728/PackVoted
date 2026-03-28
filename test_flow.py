import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def run_test():
    print("1. Creating Trip...")
    response = requests.post(
        f"{BASE_URL}/api/trips",
        params={
            "name": "Automated Test Trip",
            "creator_email": "admin@example.com",
            "creator_name": "Admin",
            "duration_days": 4,
            "budget_min": 1000,
            "budget_max": 5000,
            "participant_emails": ["p1@test.com", "p2@demo.com"]
        }
    )
    if response.status_code != 200:
        print(f"Error creating trip: {response.text}")
        return
    
    trip_data = response.json()
    trip_id = trip_data["trip_id"]
    print(f"Trip created! ID: {trip_id}")
    
    # Get participants and form links
    trip_info = requests.get(f"{BASE_URL}/api/trips/{trip_id}").json()
    participants = trip_info.get("participants", [])
    print(f"Got {len(participants)} participants.")
    
    for p in participants:
        token = p["form_token"]
        print(f"Submitting preferences for {p['email']} (token: {token})...")
        pref_res = requests.post(
            f"{BASE_URL}/api/submit-preferences/{token}",
            json={},  # The backend uses query params for this endpoint strangely
            params={
                "budget_ceiling": 4500,
                "budget_floor": 2000,
                "climate": "warm" if "admin" in p["email"] else "mild",
                "activity_level": 0.8,
                "culture_nature": 0.5,
                "nightlife_importance": 0.7,
                "food_importance": 0.9
            }
        )
        if pref_res.status_code != 200:
            print(f"Failed to submit: {pref_res.text}")
    
    print("Waiting for recommendation generation (pooling...)")
    for _ in range(10):
        time.sleep(2)
        rec_res = requests.get(f"{BASE_URL}/api/trips/{trip_id}/recommendations")
        if rec_res.status_code == 200:
            recs = rec_res.json()["recommendations"]
            print(f"Generated {len(recs)} recommendations!")
            if not recs:
                print("No recommendations returned.")
                return
            best_dest = recs[0]["destination"]["name"]
            break
    else:
        print("Timed out waiting for recommendations or status stays 400.")
        return

    print(f"Selecting best destination: {best_dest}")
    sel_res = requests.post(f"{BASE_URL}/api/trips/{trip_id}/select-destination", params={"destination_name": best_dest})
    if sel_res.status_code != 200:
        print(f"Failed selection: {sel_res.text}")
        return
        
    print(f"Getting Itinerary for {best_dest}...")
    itin_res = requests.get(f"{BASE_URL}/api/trips/{trip_id}/itinerary")
    if itin_res.status_code == 200:
        print("Success! Itinerary received:")
        print(itin_res.json().get("overview", "No overview returned. Keys: " + str(list(itin_res.json().keys()))))
    else:
        print(f"Itinerary fail: {itin_res.text}")

if __name__ == '__main__':
    run_test()
