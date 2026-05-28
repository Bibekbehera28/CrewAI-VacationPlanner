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


def extract_number_from_text(text: str) -> int | None:
    """Extract first integer from text — fixes '2 days', '2', 'two' etc."""
    # Direct digit extraction
    match = re.search(r'\b(\d+)\b', text)
    if match:
        return int(match.group(1))
    # Word to number
    words = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
             "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
             "eleven": 11, "twelve": 12, "fourteen": 14, "fifteen": 15}
    text_lower = text.lower()
    for word, num in words.items():
        if word in text_lower:
            return num
    return None


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
    """
    Extracts travel fields using LLM.
    Also applies Python-level fixes for numbers and currency.
    """
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
- "3 days" or "for 3 days" or "3" → trip_duration_days: 3
- "2" when asked about days → trip_duration_days: 2
- "from Hyderabad" or "leaving from Delhi" → source_location: "Hyderabad"
- "trip to India" → destination_country: "India"
- "want to go to Bangalore" → destination_preference: "Bangalore"
- missing_fields lists only absent mandatory fields: category, budget, trip_duration_days

Rules:
- budget is number only, no currency text
- number_of_people is integer
- trip_duration_days is integer — extract from "2", "2 days", "two days" etc.
- Keep existing non-null values, never reset to null
- Return valid JSON only, no markdown, no explanation
""",
        expected_output="Valid JSON object",
        agent=conversation_agent
    )

    crew = Crew(agents=[conversation_agent], tasks=[task], verbose=False)
    result = run_crew_with_retry(crew)
    parsed = parse_json_safely(str(result))

    # ── Python-level fix: if LLM failed to extract trip_duration_days
    # but the message is a short numeric answer, extract it directly ──
    if not parsed.get("trip_duration_days"):
        num = extract_number_from_text(user_query)
        # Only use if the context suggests it's a duration answer
        # (existing state has no duration yet)
        if num and existing_state and not existing_state.get("trip_duration_days"):
            # Check if the only missing field was trip_duration_days
            had_category = existing_state.get("category")
            had_budget = existing_state.get("budget_in_user_currency")
            if had_category and had_budget:
                parsed["trip_duration_days"] = num

    # ── Python-level fix: if LLM failed to extract number_of_people ──
    if not parsed.get("number_of_people") and existing_state:
        had_duration = existing_state.get("trip_duration_days") or parsed.get("trip_duration_days")
        had_category = existing_state.get("category")
        had_budget = existing_state.get("budget_in_user_currency")
        if had_category and had_budget and had_duration:
            num = extract_number_from_text(user_query)
            if num:
                parsed["number_of_people"] = num

    # ── Budget conversion ──
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
    destination_preference = state.get("destination_preference", "")
    category = state.get("category", "Tourist")
    cat_hint = CATEGORY_GUIDANCE.get(category, "Suitable for all travelers.")
    num_people = state.get("number_of_people", 1)
    duration = state.get("trip_duration_days", 3)

    if destination_preference:
        dest_instruction = f"""
User specifically wants to go to {destination_preference}.
Put {destination_preference} as rank 1.
Then suggest 4 similar alternatives nearby or in the same region.
"""
    elif destination_country:
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
    raw_result = run_crew_with_retry(crew)
    result = parse_json_safely(str(raw_result))

    destinations = (
        result.get("destinations") or
        result.get("Destinations") or
        result.get("destination_list") or
        result.get("recommended_destinations") or
        result.get("top_destinations") or
        []
    )

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
    budget_user = float(budget_user)

    source_location = state.get("source_location", "unknown city")
    top_destination = state.get("destination_preference", "Goa")
    top_country = state.get("destination_country", "")
    category = state.get("category", "Tourist")
    cat_hint = CATEGORY_GUIDANCE.get(category, "Suitable for all travelers.")
    num_people = state.get("number_of_people", 1)
    duration = state.get("trip_duration_days", 3)

    hotel_budget = round(budget_user * 0.40)
    activities_budget = round(budget_user * 0.60)

    hotel_data = get_hotels_in_city(top_destination)
    hotel_data_str = json.dumps(hotel_data, indent=2)

    t_hotels = Task(
        description=f"""
Find 3 hotels in {top_destination}, {top_country}.
Total hotel budget: {currency_symbol}{hotel_budget} for {duration} nights. People: {num_people}. Category: {category}.

Real hotel data from Geoapify:
{hotel_data_str}

Rules:
- Hotels MUST be in {top_destination} only. Ignore any data from wrong city.
- Show prices in {currency_name}.
- price_per_night x {duration} nights = total_stay.
- NEVER set price to 0. Minimum price_per_night is {currency_symbol}{round(hotel_budget / duration / 3)}.
- If Geoapify data is empty or wrong city, invent realistic hotel names in {top_destination} with realistic prices.
- JSON key must be exactly "hotels".

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
        expected_output="JSON with 3 hotels with non-zero prices",
        agent=hotel_agent
    )

    t_plan = Task(
        description=f"""
Create vacation plan for {top_destination}, {top_country}.
From: {source_location}. Category: {category}. Total Budget: {currency_symbol}{budget_user}. People: {num_people}. Days: {duration}. Season: {season}.
Use hotels from previous task. No flights needed.
All costs in {currency_name}.

BUDGET RULES:
- Total = {currency_symbol}{budget_user}
- Hotels = {currency_symbol}{hotel_budget} (40%)
- Activities and food = {currency_symbol}{activities_budget} (60%)
- Never set any cost to 0

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
        "hotels_{currency_code}": {hotel_budget},
        "activities_and_food_{currency_code}": {activities_budget}
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

    # ── Force correct budget in Python ──
    plan["currency_symbol"] = currency_symbol
    plan["currency_name"] = currency_name
    plan["currency_code"] = currency_code

    total_key = f"total_budget_{currency_code}"
    hotels_key = f"hotels_{currency_code}"
    activities_key = f"activities_and_food_{currency_code}"

    hotels_in_plan = plan.get("hotels", [])
    if hotels_in_plan:
        rank1 = next((h for h in hotels_in_plan if h.get("rank") == 1), hotels_in_plan[0])
        actual_hotel_cost = float(rank1.get(f"total_stay_{currency_code}", hotel_budget))
        # Fix 0 cost hotels
        if actual_hotel_cost == 0:
            actual_hotel_cost = hotel_budget
            rank1[f"total_stay_{currency_code}"] = hotel_budget
            rank1[f"price_per_night_{currency_code}"] = round(hotel_budget / duration)
    else:
        actual_hotel_cost = hotel_budget

    actual_activities = round(budget_user - actual_hotel_cost)

    plan[total_key] = budget_user
    plan["budget_breakdown"] = {
        hotels_key: actual_hotel_cost,
        activities_key: actual_activities
    }

    # Store user currency values explicitly for frontend
    plan["budget_in_user_currency"] = budget_user
    plan["budget_display"] = f"{currency_symbol}{int(budget_user):,}"

    return plan