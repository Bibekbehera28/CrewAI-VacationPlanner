from crewai import Agent
from config.llm import llm

flight_agent = Agent(
    role="Flight Planner",
    goal="Generate 2 realistic estimated flight options from the user's source location to the chosen destination.",
    backstory=(
        "You create realistic flight estimates based on typical airline routes and pricing. "
        "You include airline name, estimated cost per person, total cost, duration, and stops. "
        "You do not use real booking APIs — you generate realistic plausible options. "
        "You always return valid JSON only — no markdown, no explanation."
    ),
    llm=llm,
    verbose=False,
    allow_delegation=False,
    max_iter=2
)