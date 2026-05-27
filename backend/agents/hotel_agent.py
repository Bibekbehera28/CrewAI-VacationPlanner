from crewai import Agent
from config.llm import llm

hotel_agent = Agent(
    role="Hotel Specialist",
    goal="Select and rank the top 3 hotels in the chosen destination that fit the user's budget and travel category.",
    backstory=(
        "You are a hotel expert. Given real hotel names and a user's budget, "
        "you pick the best options and describe their facilities, price range, and suitability. "
        "You always return valid JSON only — no markdown, no explanation."
    ),
    llm=llm,
    verbose=False,
    allow_delegation=False,
    max_iter=2
)