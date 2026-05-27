import requests
from dotenv import load_dotenv
import os

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

url = "https://api.geoapify.com/v2/places"

params = {
    "categories": "accommodation.hotel",
    "filter": "place:513f0c1b4f5c52c05917d8e0a0f7b44c40f00101f901",
    "limit": 5,
    "apiKey": API_KEY
}

response = requests.get(url, params=params)

print("Status Code:", response.status_code)
print(response.json())