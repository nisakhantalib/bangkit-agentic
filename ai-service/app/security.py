"""Server-to-server auth: a shared API key checked on /v1/* endpoints.

Enabled only when SERVICE_API_KEY is set — local dev stays friction-free while
production requires the Next.js server (never the browser) to present the key.
"""

from __future__ import annotations

from fastapi import Header, HTTPException

from app.config import get_settings


async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    expected = get_settings().service_api_key
    if not expected:
        return  # auth disabled (dev)
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="invalid or missing API key")
