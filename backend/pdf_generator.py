"""Render a one-page A4 candidate summary PDF via WeasyPrint (build spec §12)."""
from __future__ import annotations

import logging
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

import config
from scoring import ScoreResult

logger = logging.getLogger("emr.pdf")

_TEMPLATE_DIR = config.BASE_DIR / "templates"
_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),  # escapes candidate free-text
)

# Keep written answers compact so the summary stays on one A4 page; the full text
# always lives in the Responses sheet.
_ANSWER_CLIP = 320

_C_QUESTIONS = [
    "A time you failed or fell short",
    "Ownership taken without being asked",
    "Response to critical feedback",
    "An area to grow in, and SUSC's part in it",
]


def _clip(text: str, limit: int = _ANSWER_CLIP) -> str:
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def _marker_pct(score: float) -> float:
    """Map a 1-5 score to 0-100% along the reading track."""
    if score <= 0:
        return 0.0
    return round((score - 1) / 4 * 100, 1)


def _panel_prompts(score: ScoreResult) -> list[str]:
    """Deterministic conversation aids for the panel — not a verdict."""
    prompts: list[str] = []
    # Lowest scored trait (ignoring N/A / 0).
    scored = {t: s for t, s in score.trait_scores.items() if s > 0}
    if scored:
        low_trait = min(scored, key=scored.get)
        if score.trait_scores[low_trait] < 3.5:
            prompts.append(
                f"Explore {config.TRAIT_NAMES[low_trait].lower()} — it scored lowest; "
                f"ask for a recent concrete example."
            )
    if score.attention_flag == "fail":
        prompts.append("Attention-check missed — worth a light, non-accusatory verify of engagement.")
    if score.rush_flag == "fail":
        prompts.append("Section B was completed quickly — consider whether answers feel considered in person.")
    if not prompts:
        prompts.append("Scores are broadly consistent — use the interview to add colour and specifics.")
    return prompts


def build_context(
    *,
    name: str,
    student_id: str,
    timestamp: str,
    score: ScoreResult,
    fit_summary: str,
    c_review: str,
    written: dict[str, str],
) -> dict:
    traits = []
    for t in config.TRAIT_ORDER:
        s = score.trait_scores.get(t, 0.0)
        traits.append(
            {
                "code": t,
                "name": config.TRAIT_NAMES[t],
                "score": s,
                "band": score.trait_buckets.get(t, "N/A"),
                "pct": _marker_pct(s),
            }
        )
    written_items = [
        {"q": q, "a": _clip(written.get(f"c{i + 1}", ""))}
        for i, q in enumerate(_C_QUESTIONS)
    ]
    return {
        "name": name,
        "student_id": student_id,
        "timestamp": timestamp,
        "traits": traits,
        "attention_flag": score.attention_flag,
        "rush_flag": score.rush_flag,
        "avg_ms": score.avg_ms,
        "fit_summary": fit_summary,
        "c_review": c_review,
        "written": written_items,
        "panel_prompts": _panel_prompts(score),
    }


def render_pdf(context: dict, out_path: Path) -> Path:
    from weasyprint import HTML

    template = _env.get_template("report.html")
    html = template.render(**context)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    HTML(string=html, base_url=str(_TEMPLATE_DIR)).write_pdf(str(out_path))
    logger.info("Rendered PDF: %s", out_path)
    return out_path
