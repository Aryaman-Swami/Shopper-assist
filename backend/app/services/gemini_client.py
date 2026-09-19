import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

from app.errors import GeminiNotConfigured

load_dotenv(Path(__file__).resolve().parents[3] / ".env")

_client = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise GeminiNotConfigured(
                "GEMINI_API_KEY is not set. Add it to your .env file "
                "(get one at https://aistudio.google.com/apikey)."
            )
        _client = genai.Client(api_key=api_key)
    return _client
