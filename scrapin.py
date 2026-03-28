import requests
from bs4 import BeautifulSoup
import json
import time
import os

BASE_URL = "https://www.holidify.com"
START_URL = "https://www.holidify.com/country/india/places-to-visit.html"
OUTPUT_FILE = "data/raw/holidify_dump.json"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

places = []
visited = set()
page = 0
MAX_PAGES = 5  # Limit for testing, increase for full scrape

print(f"Starting scrape... Target: {OUTPUT_FILE}")

while page < MAX_PAGES:
    page_url = START_URL if page == 0 else f"{START_URL}?pageNum={page}"
    print(f"Scraping Page {page}: {page_url}")

    try:
        response = requests.get(page_url, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch {page_url} - Status: {response.status_code}")
            break
    except Exception as e:
        print(f"Error fetching {page_url}: {e}")
        break

    soup = BeautifulSoup(response.text, "html.parser")
    cards = soup.select("div.content-card")

    if not cards:
        print("No more cards found.")
        break

    for card in cards:
        name_tag = card.select_one("h3")
        link_tag = card.find("a", href=True)

        if not name_tag or not link_tag:
            continue

        name = name_tag.get_text(strip=True)
        
        # Remove leading numbers like "1. " from scraper side if easiest, or cleaning script
        # Let's keep raw data mostly raw
        
        if name in visited:
            continue
        visited.add(name)

        url = BASE_URL + link_tag["href"]

        # extract state (Located in:)
        state = "Unknown"
        for tag in card.find_all(["span", "small", "p"]):
            txt = tag.get_text(strip=True)
            if "Located in:" in txt:
                state = txt.replace("Located in:", "").strip()
                break

        # description
        desc_tag = card.find("p", class_="card-text") # Adjust selector if needed based on site
        if not desc_tag:
             desc_tag = card.find("p")
             
        description = desc_tag.get_text(strip=True) if desc_tag else "Popular tourist destination"

        places.append({
            "name": name,
            "state": state,
            "description": description,
            "url": url,
            "scraped_at": time.time()
        })

    page += 1
    time.sleep(1)

# Ensure directory exists
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(places, f, indent=2, ensure_ascii=False)

print(f"Scraping complete. {len(places)} places saved to {OUTPUT_FILE}")
