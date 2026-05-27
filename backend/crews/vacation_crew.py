import json
import re
import time
from crewai import Task, Crew
from agents.conversation_agent import conversation_agent
from agents.destination_agent import destination_agent
from agents.hotel_agent import hotel_agent
from agents.final_planner_agent import final_planner_agent
from tools.weather_tool import get_current_season_and_weather
from tools.places_tool import get_hotels_in_city


CURRENCY_RATES = {
    "inr": 0.012, "rupees": 0.012, "rupee": 0.012,
    "rs": 0.012, "₹": 0.012,
    "eur": 1.08, "euros": 1.08, "euro": 1.08, "€": 1.08,
    "gbp": 1.27, "pounds": 1.27, "pound": 1.27, "£": 1.27,
    "usd": 1.0, "dollars": 1.0, "dollar": 1.0, "$": 1.0,
    "aed": 0.27, "sgd": 0.74, "aud": 0.65, "cad": 0.73
}

CURRENCY_SYMBOLS_MAP = {
    "inr": "₹", "rupees": "₹", "rupee": "₹", "rs": "₹", "₹": "₹",
    "eur": "€", "euros": "€", "euro": "€", "€": "€",
    "gbp": "£", "pounds": "£", "pound": "£", "£": "£",
    "usd": "$", "dollars": "$", "dollar": "$", "$": "$",
    "aed": "AED", "sgd": "SGD", "aud": "AUD", "cad": "CAD"
}

CURRENCY_NAMES = {
    "inr": "Indian Rupees (INR)", "rupees": "Indian Rupees (INR)",
    "rupee": "Indian Rupees (INR)", "rs": "Indian Rupees (INR)", "₹": "Indian Rupees (INR)",
    "eur": "Euros (EUR)", "euros": "Euros (EUR)", "€": "Euros (EUR)",
    "gbp": "British Pounds (GBP)", "pounds": "British Pounds (GBP)", "£": "British Pounds (GBP)",
    "usd": "US Dollars (USD)", "dollars": "US Dollars (USD)", "$": "US Dollars (USD)"
}

CATEGORY_GUIDANCE = {
    "Family":   "Safe, peaceful, family-friendly with kid activities.",
    "Couple":   "Romantic, scenic, intimate dining, privacy.",
    "Friends":  "Adventure, group activities, trekking, nightlife.",
    "Bachelor": "Beaches, nightlife, water sports, party scenes.",
    "Tourist":  "Iconic landmarks, sightseeing, cultural experiences."
}


def detect_currency(query: str) -> tuple:
    query_lower = query.lower()
    for keyword, rate in CURRENCY_RATES.items():
        if keyword in query_lower:
            symbol = CURRENCY_SYMBOLS_MAP.get(keyword, "$")
            name = CURRENCY_NAMES.get(keyword, "US Dollars (USD)")
            return keyword, symbol, rate, name
    return "usd", "$", 1.0, "US Dollars (USD)"


def user_to_usd(amount: float, rate: float) -> float:
    return round(amount * rate, 2)


def parse_json_safely(text: str) -> dict:
    text = re.sub(r"```json|```", "", text).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        matches = list(re.finditer(r'\{[\s\S]*\}', text))
        if matches:
            try:
                return json.loads(matches[-1].group())
            except Exception:
                pass
    return {}


def run_crew_with_retry(crew, retries=3, wait=35):
    for attempt in range(retries):
        try:
            return crew.kickoff()
        except Exception as e:
            if "429" in str(e) or "rate" in str(e).lower():
                if attempt < retries - 1:
                    print(f"Rate limited — waiting {wait}s before retry {attempt + 2}/{retries}")
                    time.sleep(wait)
                else:
                    raise e
            else:
                raise e


def extract_travel_data(user_query: str, existing_state: dict = None) -> dict:
    state_context = ""
    if existing_state:
        existing_clean = {
            k: v for k, v in existing_state.items()
            if k in ["category", "budget_in_user_currency", "number_of_people",
                     "trip_duration_days", "destination_preference",
                     "destination_country", "source_location"]
            and v is not None
        }
        if existing_clean:
            state_context = f"\nAlready collected: {json.dumps(existing_clean)}\nKeep these values."

    if existing_state and existing_state.get("currency_code") and existing_state["currency_code"] != "usd":
        currency_code = existing_state["currency_code"]
        currency_symbol = existing_state["currency_symbol"]
        rate_to_usd = existing_state["rate_to_usd"]
        currency_name = existing_state.get("currency_name", "US Dollars (USD)")
    else:
        currency_code, currency_symbol, rate_to_usd, currency_name = detect_currency(user_query)

    task = Task(
        description=f"""
Extract travel details from this message: "{user_query}"
{state_context}

Return ONLY this JSON:
{{
    "category": null,
    "budget": null,
    "number_of_people": null,
    "trip_duration_days": null,
    "destination_preference": null,
    "destination_country": null,
    "source_location": null,
    "missing_fields": []
}}

Examples:
- "Friends trip to Goa" → category: "Friends", destination_preference: "Goa"
- "3 members" or "we are 3" → number_of_people: 3
- "budget ₹15000" or "15000 rupees" → budget: 15000
- "3 days" or "for 3 days" → trip_duration_days: 3
- "from Hyderabad" or "leaving from Delhi" → source_location: "Hyderabad"
- "trip to India" → destination_country: "India"
- missing_fields lists only absent fields from: category, budget, trip_duration_days

Rules:
- budget is number only, no currency text
- number_of_people is integer
- Keep existing non-null values, never reset to null
- Return valid JSON only, no markdown, no explanation
""",
        expected_output="Valid JSON object",
        agent=conversation_agent
    )

    crew = Crew(agents=[conversation_agent], tasks=[task], verbose=False)
    result = run_crew_with_retry(crew)
    parsed = parse_json_safely(str(result))

    if parsed.get("budget") is not None:
        raw_budget = float(parsed["budget"])
        parsed["budget_in_user_currency"] = raw_budget
        parsed["budget_usd"] = user_to_usd(raw_budget, rate_to_usd)
        parsed["budget"] = parsed["budget_usd"]
    elif existing_state and existing_state.get("budget_in_user_currency"):
        parsed["budget_in_user_currency"] = existing_state["budget_in_user_currency"]
        parsed["budget_usd"] = existing_state.get("budget_usd", existing_state.get("budget"))
        parsed["budget"] = parsed["budget_usd"]

    parsed["currency_code"] = currency_code
    parsed["currency_symbol"] = currency_symbol
    parsed["rate_to_usd"] = rate_to_usd
    parsed["currency_name"] = currency_name

    return parsed


def run_destination_agent(state: dict) -> list:
    weather_data = get_current_season_and_weather(state.get("source_location"))
    season = weather_data.get("current_season", "Unknown")
    month = weather_data.get("current_month", "Unknown")

    currency_symbol = state.get("currency_symbol", "$")
    currency_name = state.get("currency_name", "US Dollars (USD)")
    currency_code = state.get("currency_code", "usd")
    budget_user = state.get("budget_in_user_currency") or state.get("budget", 0)

    source_location = state.get("source_location", "unknown city")
    destination_country = state.get("destination_country", "")
    category = state.get("category", "Tourist")
    cat_hint = CATEGORY_GUIDANCE.get(category, "Suitable for all travelers.")
    num_people = state.get("number_of_people", 1)
    duration = state.get("trip_duration_days", 3)

    if destination_country:
        dest_instruction = f"Suggest TOP 3 destinations inside {destination_country} first (rank 1,2,3) then 2 international (rank 4,5)."
    else:
        dest_instruction = f"Suggest 2-3 domestic destinations near {source_location} and 2-3 international options."

    task = Task(
        description=f"""
Suggest 5 vacation destinations.
From: {source_location}, Category: {category} ({cat_hint}), Budget: {currency_symbol}{budget_user}, People: {num_people}, Days: {duration}, Season: {season} (month {month}).
{dest_instruction}
Only suggest destinations reachable within budget {currency_symbol}{budget_user}.

IMPORTANT: The JSON key MUST be called exactly "destinations".

Return ONLY this JSON:
{{
    "destinations": [
        {{
            "rank": 1,
            "name": "",
            "country": "",
            "reason": "",
            "best_for": "",
            "estimated_budget_per_person_{currency_code}": 0,
            "estimated_hotel_per_night_{currency_code}": 0,
            "climate_now": "",
            "season_match": "",
            "within_requested_country": true
        }}
    ]
}}
""",
        expected_output="JSON with destinations list",
        agent=destination_agent
    )

    crew = Crew(agents=[destination_agent], tasks=[task], verbose=False)
    result = parse_json_safely(str(run_crew_with_retry(crew)))

    # Try multiple possible key names
    destinations = (
        result.get("destinations") or
        result.get("Destinations") or
        result.get("destination_list") or
        result.get("recommended_destinations") or
        result.get("top_destinations") or
        []
    )

    # If still empty check if result itself is a list
    if not destinations and isinstance(result, list):
        destinations = result

    return destinations


def run_planning_agents(state: dict) -> dict:
    weather_data = get_current_season_and_weather(state.get("source_location"))
    season = weather_data.get("current_season", "Unknown")
    month = weather_data.get("current_month", "Unknown")

    currency_symbol = state.get("currency_symbol", "$")
    currency_name = state.get("currency_name", "US Dollars (USD)")
    currency_code = state.get("currency_code", "usd")
    budget_user = state.get("budget_in_user_currency") or state.get("budget", 0)

    source_location = state.get("source_location", "unknown city")
    top_destination = state.get("destination_preference", "Goa")
    top_country = state.get("destination_country", "")
    category = state.get("category", "Tourist")
    cat_hint = CATEGORY_GUIDANCE.get(category, "Suitable for all travelers.")
    num_people = state.get("number_of_people", 1)
    duration = state.get("trip_duration_days", 3)
    hotel_budget = round(budget_user * 0.40)

    hotel_data = get_hotels_in_city(top_destination)
    hotel_data_str = json.dumps(hotel_data, indent=2)

    t_hotels = Task(
        description=f"""
Find 3 hotels in {top_destination}, {top_country}.
Budget: {currency_symbol}{hotel_budget} for hotels. People: {num_people}. Days: {duration}. Category: {category}.

Real hotel data from Geoapify:
{hotel_data_str}

Rules:
- Hotels MUST be in {top_destination} only. Ignore wrong-city data.
- Show prices in {currency_name}. Never set price to 0.
- IMPORTANT: JSON key must be exactly "hotels".

Return ONLY this JSON:
{{
    "hotels": [
        {{
            "rank": 1,
            "name": "",
            "address": "",
            "city": "{top_destination}",
            "country": "{top_country}",
            "price_per_night_{currency_code}": 0,
            "total_stay_{currency_code}": 0,
            "lat": null,
            "lon": null,
            "facilities": [],
            "suitability": "",
            "budget_fit": ""
        }}
    ]
}}
""",
        expected_output="JSON with 3 hotels",
        agent=hotel_agent
    )

    t_plan = Task(
        description=f"""
Create vacation plan for {top_destination}, {top_country}.
From: {source_location}. Category: {category}. Budget: {currency_symbol}{budget_user}. People: {num_people}. Days: {duration}. Season: {season}.
Use hotels from previous task. No flights needed.
All costs in {currency_name}. Never set cost to 0.

Return ONLY this JSON:
{{
    "destination": "{top_destination}",
    "country": "{top_country}",
    "departure_city": "{source_location}",
    "season": "{season}",
    "currency_symbol": "{currency_symbol}",
    "currency_name": "{currency_name}",
    "currency_code": "{currency_code}",
    "weather_summary": "",
    "hotels": [],
    "day_by_day": [{{"day": 1, "title": "", "activities": []}}],
    "total_budget_{currency_code}": {budget_user},
    "budget_breakdown": {{
        "hotels_{currency_code}": 0,
        "activities_and_food_{currency_code}": 0
    }},
    "travel_tips": [],
    "best_time_to_visit": "",
    "visa_info": ""
}}
""",
        expected_output="Complete vacation plan JSON",
        agent=final_planner_agent,
        context=[t_hotels]
    )

    crew = Crew(
        agents=[hotel_agent, final_planner_agent],
        tasks=[t_hotels, t_plan],
        verbose=False
    )

    result = run_crew_with_retry(crew)
    plan = parse_json_safely(str(result))
    plan["currency_symbol"] = currency_symbol
    plan["currency_name"] = currency_name
    plan["currency_code"] = currency_code

    return plan