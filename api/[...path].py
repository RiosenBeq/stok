"""Vercel Python serverless entrypoint.

Filesystem routing in vercel.json sends every /api/* request here. We expose
the existing FastAPI ASGI app; Vercel's @vercel/python runtime handles ASGI
natively, so all our /api/v1/... routes match without rewrites.
"""
import sys
from pathlib import Path

# Make the backend package importable.
BACKEND = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.main import app  # noqa: E402,F401  (re-exported for Vercel)
