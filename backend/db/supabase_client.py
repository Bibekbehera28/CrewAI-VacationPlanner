from supabase import create_client
from config.settings import SUPABASE_URL, SUPABASE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def save_plan(user_query: str, state: dict, final_plan: dict):
    try:
        supabase.table("vacation_plans").insert({
            "user_query": user_query,
            "extracted_state": state,
            "final_plan": final_plan
        }).execute()
    except Exception as e:
        print(f"Supabase save error: {e}")