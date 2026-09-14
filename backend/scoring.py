"""Deterministic scoring: trait averages (with reverse-coding), attention & rush flags."""
from __future__ import annotations

from dataclasses import dataclass, field

from config import (
    CHECK_CORRECT_VALUE,
    RUSH_THRESHOLD_MS,
    TRAIT_ORDER,
    bucket_label,
    items_by_id,
)


@dataclass
class ScoreResult:
    trait_scores: dict[str, float]  # trait -> mean 1..5 (after reverse-coding)
    trait_buckets: dict[str, str]  # trait -> Low/Moderate/High
    attention_flag: str  # "pass" / "fail"
    rush_flag: str  # "pass" / "fail"
    avg_ms: float = 0.0
    per_trait_items: dict[str, list[float]] = field(default_factory=dict)


def _reverse_code(value: int, reverse: bool) -> float:
    return (6 - value) if reverse else float(value)


def score_submission(
    answers: list[dict],
    check_answer: int | None,
) -> ScoreResult:
    """
    answers: list of {"id","value","ms"} for scored items only (check item excluded).
    check_answer: candidate's response to the injected attention-check item, or None.
    """
    items = items_by_id()
    per_trait: dict[str, list[float]] = {t: [] for t in TRAIT_ORDER}
    ms_values: list[int] = []

    for a in answers:
        item = items.get(a["id"])
        if item is None:
            # Unknown id (e.g. a stray "check1") — never counts toward trait scores.
            continue
        coded = _reverse_code(int(a["value"]), bool(item["reverse"]))
        per_trait[item["trait"]].append(coded)
        ms_values.append(int(a.get("ms", 0)))

    trait_scores: dict[str, float] = {}
    trait_buckets: dict[str, str] = {}
    for trait, vals in per_trait.items():
        if vals:
            score = round(sum(vals) / len(vals), 2)
        else:
            score = 0.0
        trait_scores[trait] = score
        trait_buckets[trait] = bucket_label(score) if vals else "N/A"

    # Attention flag: correct only when the candidate answered Neutral.
    attention_flag = "pass" if check_answer == CHECK_CORRECT_VALUE else "fail"

    # Rush flag: average per-item time below threshold.
    avg_ms = (sum(ms_values) / len(ms_values)) if ms_values else 0.0
    rush_flag = "fail" if (ms_values and avg_ms < RUSH_THRESHOLD_MS) else "pass"

    return ScoreResult(
        trait_scores=trait_scores,
        trait_buckets=trait_buckets,
        attention_flag=attention_flag,
        rush_flag=rush_flag,
        avg_ms=round(avg_ms, 1),
        per_trait_items=per_trait,
    )
