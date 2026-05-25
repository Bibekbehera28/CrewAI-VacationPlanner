from crewai import Agent

agent = Agent(
    role="Travel Advisor",
    goal="Help users plan vacations",
    backstory="Expert travel consultant",
    verbose=True
)

print("CrewAI Working Successfully!")