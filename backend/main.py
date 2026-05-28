import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from crews.vacation_crew import extract_travel_data, run_destination_agent, run_planning_agents
from db.supabase_client import save_plan, supabase

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

executor = ThreadPoolExecutor(max_workers=4)
sessions: dict = {}

CATEGORY_DEFAULT_PEOPLE = {
    "Couple": 2,
    "Bachelor": 1,
}

FOLLOW_UP_QUESTIONS = {
    "category":           "Is this a Family trip, Couple getaway, Friends trip, Bachelor trip, or Tourist visit?",
    "budget":             "What is your total budget for this trip? Please mention the currency too (e.g. ₹15000, $500, €800).",
    "trip_duration_days": "How many days are you planning for this trip?",
    "number_of_people":   "How many people will be travelling?",
    "source_location":    "Which city will you be travelling from?"
}


class ChatMessage(BaseModel):
    session_id: str
    message: str
    source_location: Optional[str] = None


class DestinationSelect(BaseModel):
    session_id: str
    chosen_destination: str
    chosen_country: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/trips")
async def get_trips():
    try:
        result = supabase.table("vacation_plans").select("*").order("created_at", desc=True).execute()
        trips = []
        for row in result.data:
            state = row.get("extracted_state", {})
            plan = row.get("final_plan", {})
            trips.append({
                "id": row.get("id"),
                "created_at": row.get("created_at"),
                "destination": state.get("destination_preference") or plan.get("destination", "Unknown"),
                "country": state.get("destination_country") or plan.get("country", ""),
                "category": state.get("category", ""),
                # Always use budget_in_user_currency — never the USD converted value
                "budget": state.get("budget_in_user_currency") or state.get("budget", 0),
                "currency_symbol": state.get("currency_symbol", "$"),
                "currency_name": state.get("currency_name", "US Dollars (USD)"),
                "duration_days": state.get("trip_duration_days", 0),
                "number_of_people": state.get("number_of_people", 0),
                "user_query": row.get("user_query", ""),
                "full_plan": plan
            })
        return {"trips": trips}
    except Exception as e:
        return {"trips": [], "error": str(e)}


@app.post("/api/chat")
async def chat(body: ChatMessage):
    session_id = body.session_id
    user_message = body.message

    if session_id not in sessions:
        sessions[session_id] = {
            "state": {},
            "history": [],
            "stage": "collecting",
            "destinations": [],
            "final_plan": None
        }

    session = sessions[session_id]
    session["history"].append({"role": "user", "content": user_message})

    if session["stage"] == "done":
        return {
            "type": "done",
            "message": "Your vacation plan is already ready!",
            "plan": session["final_plan"]
        }

    # Inject browser location
    if body.source_location and not session["state"].get("source_location"):
        session["state"]["source_location"] = body.source_location

    loop = asyncio.get_event_loop()

    if session["stage"] == "collecting":
        try:
            updated_state = await loop.run_in_executor(
                executor,
                lambda: extract_travel_data(user_message, session["state"])
            )
        except Exception as e:
            return {"type": "error", "message": f"Could not understand: {str(e)}"}

        # Merge non-null values
        for key, value in updated_state.items():
            if key != "missing_fields" and value is not None:
                session["state"][key] = value

        # Auto-fill people for Couple and Bachelor
        if not session["state"].get("number_of_people"):
            category = session["state"].get("category")
            if category in CATEGORY_DEFAULT_PEOPLE:
                session["state"]["number_of_people"] = CATEGORY_DEFAULT_PEOPLE[category]

        # Build missing fields
        mandatory = ["category", "budget", "trip_duration_days"]
        missing = [f for f in mandatory if not session["state"].get(f)]

        category = session["state"].get("category")
        if not session["state"].get("number_of_people") and category in ["Family", "Friends", None]:
            missing.append("number_of_people")

        if not session["state"].get("source_location"):
            missing.append("source_location")

        if missing:
            question = FOLLOW_UP_QUESTIONS.get(
                missing[0],
                f"Could you tell me your {missing[0].replace('_', ' ')}?"
            )
            session["history"].append({"role": "assistant", "content": question})
            return {
                "type": "follow_up",
                "message": question,
                "collected_so_far": session["state"],
                "still_missing": missing
            }

        # All collected — run destination agent
        session["stage"] = "destinations"
        try:
            destinations = await loop.run_in_executor(
                executor,
                lambda: run_destination_agent(session["state"])
            )
            session["destinations"] = destinations
            return {
                "type": "destinations",
                "message": "Here are the best destinations for your trip! Select one to get the full plan.",
                "destinations": destinations,
                "collected_state": session["state"]
            }
        except Exception as e:
            session["stage"] = "collecting"
            return {"type": "error", "message": f"Destination search failed: {str(e)}"}

    return {"type": "error", "message": "Unexpected state. Please start a new session."}


@app.post("/api/select-destination")
async def select_destination(body: DestinationSelect):
    session_id = body.session_id

    if session_id not in sessions:
        return {"type": "error", "message": "Session not found. Please start a new trip."}

    session = sessions[session_id]
    state = session["state"]

    state["destination_preference"] = body.chosen_destination
    state["destination_country"] = body.chosen_country
    session["stage"] = "planning"

    loop = asyncio.get_event_loop()

    try:
        final_plan = await loop.run_in_executor(
            executor,
            lambda: run_planning_agents(state)
        )

        session["stage"] = "done"
        session["final_plan"] = final_plan

        save_plan(
            user_query=session["history"][0]["content"],
            state=state,
            final_plan=final_plan
        )

        return {
            "type": "plan",
            "message": f"Your vacation plan for {body.chosen_destination} is ready!",
            "collected_state": state,
            "plan": final_plan
        }

    except Exception as e:
        session["stage"] = "destinations"
        return {"type": "error", "message": f"Planning failed: {str(e)}"}


@app.post("/api/switch-destination")
async def switch_destination(body: DestinationSelect):
    session_id = body.session_id

    if session_id not in sessions:
        return {"type": "error", "message": "Session not found."}

    session = sessions[session_id]
    state = session["state"]

    state["destination_preference"] = body.chosen_destination
    state["destination_country"] = body.chosen_country
    session["stage"] = "planning"
    session["final_plan"] = None

    loop = asyncio.get_event_loop()

    try:
        final_plan = await loop.run_in_executor(
            executor,
            lambda: run_planning_agents(state)
        )

        session["stage"] = "done"
        session["final_plan"] = final_plan

        save_plan(
            user_query=f"Switched to {body.chosen_destination}",
            state=state,
            final_plan=final_plan
        )

        return {
            "type": "plan",
            "message": f"New plan ready for {body.chosen_destination}!",
            "collected_state": state,
            "plan": final_plan
        }

    except Exception as e:
        session["stage"] = "done"
        return {"type": "error", "message": f"Planning failed: {str(e)}"}


@app.delete("/api/session/{session_id}")
def clear_session(session_id: str):
    sessions.pop(session_id, None)
    return {"cleared": session_id}