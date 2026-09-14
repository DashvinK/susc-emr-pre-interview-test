"""Environment loading and constants for the SUSC EMR batch worker."""
from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent


def _get(key: str, default: str | None = None) -> str:
    return os.getenv(key, default) or ""


def _normalize_supabase_url(u: str) -> str:
    # Accept the bare project URL even if the REST endpoint or a trailing slash
    # was pasted (https://ref.supabase.co/rest/v1 -> https://ref.supabase.co).
    u = u.strip().rstrip("/")
    if u.endswith("/rest/v1"):
        u = u[: -len("/rest/v1")]
    return u.rstrip("/")


# --- Supabase ---
SUPABASE_URL = _normalize_supabase_url(_get("SUPABASE_URL"))
SUPABASE_SERVICE_ROLE_KEY = _get("SUPABASE_SERVICE_ROLE_KEY")
REPORTS_BUCKET = _get("REPORTS_BUCKET", "reports")
# Expiry (seconds) for the signed PDF URLs stored in results.pdf_url. Default 1 year.
SIGNED_URL_TTL = int(_get("SIGNED_URL_TTL", str(60 * 60 * 24 * 365)))

# --- LLM (Groq) ---
GROQ_API_KEY = _get("GROQ_API_KEY")
GROQ_MODEL = _get("GROQ_MODEL", "openai/gpt-oss-120b")

# --- Scoring / behaviour thresholds ---
RUSH_THRESHOLD_MS = int(_get("RUSH_THRESHOLD_MS", "1500"))
CHECK_CORRECT_VALUE = 3

# --- Trait metadata ---
TRAIT_ORDER = ["CSN", "EST", "OPN", "EXT", "AGR"]
TRAIT_NAMES = {
    "CSN": "Conscientiousness",
    "EST": "Emotional stability",
    "OPN": "Openness",
    "EXT": "Extraversion",
    "AGR": "Agreeableness",
}

# Trait-score buckets (1-5 scale).
BUCKETS = [
    (1.0, 2.4, "Low"),
    (2.5, 3.4, "Moderate"),
    (3.5, 5.0, "High"),
]


def bucket_label(score: float) -> str:
    for lo, hi, label in BUCKETS:
        if lo <= score <= hi:
            return label
    return "Moderate"


@lru_cache(maxsize=1)
def load_items() -> list[dict]:
    """Section B item definitions — the shared source of truth for scoring."""
    with open(BASE_DIR / "items_config.json", "r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def items_by_id() -> dict[str, dict]:
    return {item["id"]: item for item in load_items()}
