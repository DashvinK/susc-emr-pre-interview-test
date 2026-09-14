"""Batch analysis worker — the scheduled job (run by GitHub Actions).

Pulls unprocessed rows from Supabase, scores them, generates the SUSC fit
narrative (Groq) and the one-page PDF (WeasyPrint), uploads the PDF to Supabase
Storage, writes the results row, and marks each submission processed.

Run:  python run_batch.py
"""
from __future__ import annotations

import logging
import re
import sys
import tempfile
from pathlib import Path

import config
from llm import generate_narrative
from pdf_generator import build_context, render_pdf
from scoring import score_submission
from supabase_client import SupabaseClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("emr.batch")


def _sanitize(text: str) -> str:
    """Strip path separators and reserved/control characters for storage safety."""
    text = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "", (text or "").strip())
    return re.sub(r"\s+", " ", text).strip()


def _report_basename(name: str, student_id: str) -> str:
    """PDF object name: '<Name> (<Student ID>)', both sanitized."""
    safe_name = _sanitize(name) or "candidate"
    safe_id = _sanitize(student_id)
    return f"{safe_name} ({safe_id})" if safe_id else safe_name


def _process_one(row: dict, sb: SupabaseClient, workdir: Path) -> bool:
    """Score, narrate, render, upload, and record one submission. Returns True if flagged."""
    submission_id = row["submission_id"]

    # `answers` is stored as JSONB → already a list of {id, value, ms}.
    answers = row.get("answers") or []
    check_answer = row.get("check_answer")
    written = {k: (row.get(k) or "") for k in ("c1", "c2", "c3", "c4")}

    score = score_submission(answers, check_answer)
    was_flagged = score.attention_flag == "fail" or score.rush_flag == "fail"

    narrative = generate_narrative(score.trait_scores, score.trait_buckets, written)

    context = build_context(
        name=row.get("name", ""),
        student_id=row.get("student_id", ""),
        timestamp=row.get("created_at", ""),
        score=score,
        fit_summary=narrative["fit_summary"],
        c_review=narrative["c_review"],
        written=written,
    )

    pdf_path = render_pdf(context, workdir / f"{submission_id}.pdf")
    storage_path, pdf_url = sb.upload_pdf(
        pdf_path, _report_basename(row.get("name", ""), row.get("student_id", ""))
    )

    sb.upsert_result(
        {
            "submission_id": submission_id,
            "csn_score": score.trait_scores.get("CSN", 0.0),
            "est_score": score.trait_scores.get("EST", 0.0),
            "opn_score": score.trait_scores.get("OPN", 0.0),
            "ext_score": score.trait_scores.get("EXT", 0.0),
            "agr_score": score.trait_scores.get("AGR", 0.0),
            "attention_flag": score.attention_flag,
            "rush_flag": score.rush_flag,
            "fit_summary": narrative["fit_summary"],
            "c_review": narrative["c_review"],
            "pdf_path": storage_path,
            "pdf_url": pdf_url,
        }
    )
    sb.mark_processed(submission_id)
    logger.info("Processed %s (%s)", submission_id, "flagged" if was_flagged else "ok")
    return was_flagged


def main() -> int:
    sb = SupabaseClient()
    rows = sb.get_unprocessed_responses()
    logger.info("Found %d unprocessed submission(s).", len(rows))

    processed = 0
    flagged = 0
    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        for row in rows:
            try:
                if _process_one(row, sb, workdir):
                    flagged += 1
                processed += 1
            except Exception as exc:  # noqa: BLE001 — one bad row must not stop the batch
                logger.error("Failed to process %s: %s", row.get("submission_id"), exc)

    logger.info("Done. processed=%d flagged=%d", processed, flagged)
    return 0


if __name__ == "__main__":
    sys.exit(main())
