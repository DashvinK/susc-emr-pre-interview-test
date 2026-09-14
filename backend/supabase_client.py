"""Supabase data layer for the batch worker: read the work queue, upload PDFs,
write results, mark rows processed. Uses the service-role key (bypasses RLS)."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from supabase import Client, create_client

import config

logger = logging.getLogger("emr.supabase")


class SupabaseClient:
    def __init__(self) -> None:
        if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
        self._c: Client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

    # --- work queue ---

    def get_unprocessed_responses(self) -> list[dict[str, Any]]:
        res = (
            self._c.table("responses")
            .select("*")
            .eq("processed", False)
            .order("created_at")
            .execute()
        )
        return res.data or []

    def mark_processed(self, submission_id: str) -> None:
        self._c.table("responses").update({"processed": True}).eq(
            "submission_id", submission_id
        ).execute()

    # --- results ---

    def upsert_result(self, row: dict[str, Any]) -> None:
        # Upsert on the submission_id primary key so re-runs are idempotent.
        self._c.table("results").upsert(row).execute()

    # --- storage ---

    def upload_pdf(self, local_path: Path, submission_id: str) -> tuple[str, str]:
        """Upload the PDF to the reports bucket; return (storage_path, signed_url)."""
        storage_path = f"{submission_id}.pdf"
        data = local_path.read_bytes()
        self._c.storage.from_(config.REPORTS_BUCKET).upload(
            storage_path,
            data,
            {"content-type": "application/pdf", "upsert": "true"},
        )
        signed = self._c.storage.from_(config.REPORTS_BUCKET).create_signed_url(
            storage_path, config.SIGNED_URL_TTL
        )
        # supabase-py has used both "signedURL" and "signedUrl" across versions.
        url = signed.get("signedURL") or signed.get("signedUrl") or ""
        return f"{config.REPORTS_BUCKET}/{storage_path}", url
