import json

from google.genai import types

from app.services.gemini_client import get_client

EXTRACTION_MODEL = "gemini-2.0-flash"

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "qty": {"type": "number"},
                    "unit": {"type": "string"},
                },
                "required": ["name", "qty"],
            },
        }
    },
    "required": ["items"],
}

PROMPT = (
    "Extract a structured shopping list from the input. Return each distinct "
    "item with a name, quantity (default 1 if unspecified), and unit if given "
    "(e.g. 'dozen', 'kg', 'pack'). Normalize misspellings and abbreviations to "
    "plain product names."
)


def extract_from_text(text: str) -> list[dict]:
    client = get_client()
    response = client.models.generate_content(
        model=EXTRACTION_MODEL,
        contents=f"{PROMPT}\n\nShopping list:\n{text}",
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA,
        ),
    )
    return json.loads(response.text)["items"]


def extract_from_image(image_bytes: bytes, mime_type: str) -> list[dict]:
    client = get_client()
    response = client.models.generate_content(
        model=EXTRACTION_MODEL,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA,
        ),
    )
    return json.loads(response.text)["items"]
