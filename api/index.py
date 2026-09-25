"""Vercel entry point: exposes the FastAPI app in ``backend/`` as one serverless function.

Vercel's Python runtime looks for an ASGI ``app`` in files under ``api/``. Every
request to ``/api/*`` is rewritten to this function (see ``vercel.json``), and
FastAPI routes it from there.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.main import app  # noqa: E402  (import after sys.path change, on purpose)

__all__ = ["app"]
