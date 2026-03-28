import requests
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine('postgresql://postgres:postgres@localhost:5432/packvote')
Session = sessionmaker(bind=engine)
session = Session()

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id FROM trips WHERE selected_destination IS NOT NULL LIMIT 1"))
        row = result.fetchone()
        
    if row:
        trip_id = row[0]
        print(f"Found trip ID: {trip_id}")
        r = requests.get(f"http://localhost:8000/api/trips/{trip_id}/travel-estimate?origin=Delhi")
        print("Status Code:", r.status_code)
        print("Response:", r.json())
    else:
        print("No trip found with a selected destination.")
except Exception as e:
    print(e)
