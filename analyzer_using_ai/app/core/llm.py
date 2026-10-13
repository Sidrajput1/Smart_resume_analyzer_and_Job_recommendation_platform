
"""Gemini structured chat response helper using standard-library HTTP."""

import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException



#from huggingface_hub import InferenceClient



import logging

from groq import Groq, GroqError


logger = logging.getLogger(__name__)


def llm_json(
    system: str,
    user: dict,
    schema_name: str,
    schema: dict
) -> dict | None:

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        logger.warning(
            "GROQ_API_KEY missing, using fallback mode."
        )
        return None

    try:
        client = Groq(
            api_key=api_key,
            timeout=45.0,
            max_retries=1,
        )

        response = client.chat.completions.create(
            model=os.getenv(
                "GROQ_MODEL",
                "openai/gpt-oss-20b"
            ),
            messages=[
                {
                    "role": "system",
                    "content": system,
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        user,
                        ensure_ascii=False
                    ),
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": schema_name,
                    "strict": True,
                    "schema": schema,
                },
            },
            temperature=0.2,
            max_completion_tokens=2500,
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Empty Groq response")

        return json.loads(content)

    except GroqError as error:
        logger.error(
            "Groq API failed: %s",
            type(error).__name__
        )

        raise HTTPException(
            status_code=503,
            detail="Groq LLM service unavailable"
        ) from error

    except (ValueError, KeyError, IndexError) as error:
        logger.error(
            "Groq returned invalid response: %s",
            type(error).__name__
        )

        raise HTTPException(
            status_code=502,
            detail="Invalid Groq LLM response"
        ) from error



# def llm_json(
#     system: str,
#     user: dict,
#     schema_name: str,
#     schema: dict
# ) -> dict | None:

#     token = os.getenv("HF_TOKEN")

#     if not token:
#         # Existing fallback logic:
#         # TEMPLATE generation / HEURISTIC evaluation
#         return None

#     client = InferenceClient(
#         api_key=token,
#         provider="auto",
#     )

#     try:
#         response = client.chat_completion(
#             model=os.getenv(
#                 "HF_MODEL",
#                 "Qwen/Qwen3-32B"
#             ),
#             messages=[
#                 {
#                     "role": "system",
#                     "content": system,
#                 },
#                 {
#                     "role": "user",
#                     "content": json.dumps(user),
#                 },
#             ],
#             response_format={
#                 "type": "json_schema",
#                 "json_schema": {
#                     "name": schema_name,
#                     "strict": True,
#                     "schema": schema,
#                 },
#             },
#             max_tokens=2500,
#         )

#         content = response.choices[0].message.content

#         if not content:
#             raise ValueError("Empty LLM response")

#         return json.loads(content)

#     except Exception as error:
#         # Avoid logging tokens, resumes or transcripts.
#         print(
#             "Hugging Face request failed:",
#             type(error).__name__,
#         )

#         raise HTTPException(
#             status_code=503,
#             detail="Hugging Face inference unavailable",
#         ) from error


# Convert standard JSON Schema type names into Gemini Schema type names.
# _GEMINI_SCHEMA_TYPES = {
#     "object": "OBJECT",
#     "array": "ARRAY",
#     "string": "STRING",
#     "number": "NUMBER",
#     "integer": "INTEGER",
#     "boolean": "BOOLEAN",
# }


# def _to_gemini_schema(schema: dict) -> dict:
#     """Recursively convert the schema used by your existing endpoints."""

#     converted = {}

#     for key, value in schema.items():
#         if key == "type" and isinstance(value, str):
#             converted[key] = _GEMINI_SCHEMA_TYPES.get(
#                 value.lower(), value.upper()
#             )

#         elif key == "properties" and isinstance(value, dict):
#             converted[key] = {
#                 name: _to_gemini_schema(property_schema)
#                 for name, property_schema in value.items()
#             }

#         elif key == "items" and isinstance(value, dict):
#             converted[key] = _to_gemini_schema(value)

#         else:
#             # Preserve required, additionalProperties, enum, etc.
#             converted[key] = value

#     return converted


# def llm_json(
#     system: str,
#     user: dict,
#     schema_name: str,
#     schema: dict,
# ) -> dict | None:
#     """
#     Generate structured JSON with Gemini.

#     Returns None when GEMINI_API_KEY is missing so that
#     existing template/heuristic fallbacks can continue working.
#     """

#     api_key = os.environ.get("GEMINI_API_KEY", "")

#     if not api_key:
#         return None  # Offline demonstration mode.

#     model = os.environ.get(
#         "GEMINI_MODEL",
#         "gemini-3.1-flash-lite",
#     )

#     url = (
#         "https://generativelanguage.googleapis.com/v1beta/"
#         f"models/{model}:generateContent"
#     )

#     payload = {
#         "systemInstruction": {
#             "parts": [{"text": system}],
#         },
#         "contents": [
#             {
#                 "role": "user",
#                 "parts": [
#                     {
#                         "text": json.dumps(
#                             user,
#                             ensure_ascii=False,
#                         )
#                     }
#                 ],
#             }
#         ],
#         "generationConfig": {
#             "temperature": 0.2,
#             "responseMimeType": "application/json",
#             "responseSchema": _to_gemini_schema(schema),
#         },
#     }

#     request = Request(
#         url,
#         data=json.dumps(payload).encode("utf-8"),
#         headers={
#             "x-goog-api-key": api_key,
#             "Content-Type": "application/json",
#         },
#         method="POST",
#     )

#     try:
#         with urlopen(request, timeout=42) as response:
#             obj = json.load(response)

#         # Extract the generated JSON text from Gemini's response.
#         parts = obj["candidates"][0]["content"]["parts"]

#         content = "".join(
#             part.get("text", "")
#             for part in parts
#             if isinstance(part, dict)
#         )

#         if not content.strip():
#             raise ValueError("Gemini returned empty content")

#         result = json.loads(content)

#         if not isinstance(result, dict):
#             raise ValueError("Expected a JSON object")

#         return result

#     except (
#         HTTPError,
#         URLError,
#         TimeoutError,
#         KeyError,
#         IndexError,
#         TypeError,
#         ValueError,
#     ) as exc:
#         # Do not silently convert provider failures into AI results.
#         raise HTTPException(
#             status_code=503,
#             detail="LLM provider unavailable or invalid response",
#         ) from exc
