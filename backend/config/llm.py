from crewai import LLM
from config.settings import OPENROUTER_API_KEY

llm = LLM(
    model="openrouter/openai/gpt-oss-120b:free",
    api_key=OPENROUTER_API_KEY,
    temperature=0.3,
    max_tokens=800
)