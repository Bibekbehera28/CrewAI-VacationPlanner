import httpx
from datetime import datetime
from config.settings import OPENWEATHER_API_KEY


def get_current_season_and_weather(source_location: str = None) -> dict:
    month = datetime.now().month

    if month in [12, 1, 2]:
        season = "Winter"
    elif month in [3, 4, 5]:
        season = "Spring"
    elif month in [6, 7, 8]:
        season = "Summer"
    else:
        season = "Autumn"

    result = {
        "current_month": month,
        "current_season": season,
        "source_weather": None
    }

    if source_location and OPENWEATHER_API_KEY:
        try:
            resp = httpx.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "q": source_location,
                    "appid": OPENWEATHER_API_KEY,
                    "units": "metric"
                },
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                result["source_weather"] = {
                    "temp_c": data["main"]["temp"],
                    "feels_like": data["main"]["feels_like"],
                    "description": data["weather"][0]["description"],
                    "humidity": data["main"]["humidity"]
                }
        except Exception as e:
            result["source_weather"] = {"error": str(e)}

    return result