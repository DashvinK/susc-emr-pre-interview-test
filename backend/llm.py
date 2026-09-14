"""Groq LLM call: SUSC fit narrative + Section C consistency notes (build spec §11)."""
from __future__ import annotations

import json
import logging

import config

logger = logging.getLogger("emr.llm")

SYSTEM_PROMPT = (
    "You are assisting a university student society's exec recruitment panel. "
    "Given a candidate's Big Five trait scores and four short written answers, "
    "produce (a) a 3-5 sentence fit summary connecting the trait pattern to which "
    "type of SUSC role/department suits them, in plain, non-clinical language, and "
    "(b) one short paragraph noting whether the written answers reinforce or "
    "contradict the trait pattern. Be balanced — note strengths and possible growth "
    "areas. Do not make a hire/no-hire recommendation. "
    'Return ONLY valid JSON with exactly these keys: "fit_summary", "c_review".'
)


def _fallback(reason: str) -> dict[str, str]:
    logger.warning("LLM fallback used: %s", reason)
    return {
        "fit_summary": (
            "Automated summary unavailable — please review the trait scores and "
            "written answers directly."
        ),
        "c_review": "Automated consistency check unavailable for this candidate.",
    }


def generate_narrative(
    trait_scores: dict[str, float],
    trait_buckets: dict[str, str],
    written: dict[str, str],
) -> dict[str, str]:
    """Call Groq and return {"fit_summary", "c_review"}. Never raises."""
    if not config.GROQ_API_KEY:
        return _fallback("GROQ_API_KEY not set")

    payload = {
        "trait_scores": {
            config.TRAIT_NAMES[t]: {"score": trait_scores.get(t), "band": trait_buckets.get(t)}
            for t in config.TRAIT_ORDER
        },
        "written_answers": written,
    }

    try:
        from groq import Groq

        client = Groq(api_key=config.GROQ_API_KEY)
        completion = client.chat.completions.create(
            model=config.GROQ_MODEL,
            temperature=0.4,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
        )
        content = completion.choices[0].message.content or "{}"
        data = json.loads(content)
        return {
            "fit_summary": str(data.get("fit_summary", "")).strip() or _fallback("empty fit_summary")["fit_summary"],
            "c_review": str(data.get("c_review", "")).strip() or _fallback("empty c_review")["c_review"],
        }
    except Exception as exc:  # noqa: BLE001 — the batch must survive one bad call
        return _fallback(str(exc))
