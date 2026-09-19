"""
Gemini AI integration for Dealio CRM.

Generates structured JSON summaries for leads using the Gemini 2.5 Flash
model via the google-genai SDK. All errors are caught and returned as
a JSON error object (never raises HTTP exceptions) so the frontend can
handle failures gracefully as UI state.
"""

import json
import logging
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from models import Activity, Lead

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client initialization
# ---------------------------------------------------------------------------

_api_key = os.getenv("GEMINI_API_KEY", "")
_model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
_client: genai.Client | None = None

if _api_key:
    _client = genai.Client(api_key=_api_key)
else:
    logger.warning("GEMINI_API_KEY not set — AI summaries will be unavailable.")

MODEL_NAME = _model_name


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def _build_prompt(lead: Lead, activities: list[Activity]) -> str:
    """Build the analysis prompt from lead data and activity history."""
    activities_text = "\n".join(
        f"- [{a.type.upper()}] {a.content}"
        + (f" (completed)" if a.type == "task" and a.is_completed else "")
        for a in activities
    ) or "No interactions recorded yet."

    return (
        f"Context: You are an AI analyzing a CRM lead.\n"
        f"Lead Name: {lead.name}, Company: {lead.company}, "
        f"Value: ${lead.value:,}, Stage: {lead.stage}\n"
        f"Interaction History:\n{activities_text}\n\n"
        f"Return a strict JSON object with these exact keys:\n"
        f'{{\n'
        f'  "background": "2 sentences summarizing the client.",\n'
        f'  "intent_signal": "3-5 word label (e.g., High Buying Intent)",\n'
        f'  "missing_info": "1 crucial piece of missing B2B info '
        f'(e.g., Missing budget timeline)",\n'
        f'  "suggested_next_step": "1 concrete, actionable next task '
        f'(e.g., Draft ROI justification doc for CFO)"\n'
        f'}}'
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def generate_summary(
    lead: Lead, activities: list[Activity]
) -> dict[str, str]:
    """
    Generate an AI summary for a lead.

    Returns a dict with keys: background, intent_signal, missing_info, suggested_next_step.
    On failure, returns {"error": "..."} instead. Never raises exceptions.
    """
    if not _client:
        return {"error": "AI Summary unavailable. GEMINI_API_KEY is not configured."}

    prompt = _build_prompt(lead, activities)

    try:
        response = _client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,  # Low temp for consistent, factual summaries
            ),
        )

        result = json.loads(response.text)

        # Validate expected keys are present
        required_keys = {"background", "intent_signal", "missing_info"}
        if not required_keys.issubset(result.keys()):
            missing = required_keys - result.keys()
            logger.error(f"Gemini response missing keys: {missing}")
            return {"error": "AI Summary unavailable. Unexpected response format."}

        return {
            "background": str(result["background"]),
            "intent_signal": str(result["intent_signal"]),
            "missing_info": str(result["missing_info"]),
            "suggested_next_step": str(result.get("suggested_next_step", "")),
        }

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini JSON response: {e}")
        return {"error": "AI Summary unavailable. Please review raw history."}
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return {"error": "AI Summary unavailable. Please review raw history."}
