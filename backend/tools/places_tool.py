import httpx
from config.settings import GEOAPIFY_API_KEY


def get_hotels_in_city(city: str, limit: int = 8) -> list:
    if not GEOAPIFY_API_KEY:
        return []

    try:
        geo_resp = httpx.get(
            "https://api.geoapify.com/v1/geocode/search",
            params={
                "text": city,
                "apiKey": GEOAPIFY_API_KEY,
                "limit": 1
            },
            timeout=10
        )
        geo_data = geo_resp.json()

        if not geo_data.get("features"):
            return []

        coords = geo_data["features"][0]["geometry"]["coordinates"]
        lon, lat = coords[0], coords[1]

        places_resp = httpx.get(
            "https://api.geoapify.com/v2/places",
            params={
                "categories": "accommodation.hotel",
                "filter": f"circle:{lon},{lat},5000",
                "limit": limit,
                "apiKey": GEOAPIFY_API_KEY
            },
            timeout=10
        )

        hotels = []
        for f in places_resp.json().get("features", []):
            p = f.get("properties", {})
            name = p.get("name", "").strip()
            if name:
                hotels.append({
                    "name": name,
                    "address": p.get("formatted", "N/A"),
                    "city": city,
                    "lat": f["geometry"]["coordinates"][1],
                    "lon": f["geometry"]["coordinates"][0]
                })
        return hotels

    except Exception as e:
        return [{"error": str(e)}]