"""LangSmith tracing setup — activates only when credentials are present.

Import and call `configure_tracing()` at startup. With no LANGCHAIN_API_KEY the
function is a no-op, so dev, CI, and offline runs are unaffected. When keys are
set, LangGraph/LangChain runs are traced automatically via env vars.
"""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)


def configure_tracing() -> bool:
    """Return True if LangSmith tracing is active."""
    if os.getenv("LANGCHAIN_API_KEY") and os.getenv("LANGCHAIN_TRACING_V2") == "true":
        os.environ.setdefault("LANGCHAIN_PROJECT", "bangkit-ai-service")
        logger.info("LangSmith tracing enabled (project=%s)", os.environ["LANGCHAIN_PROJECT"])
        return True
    logger.info("LangSmith tracing disabled (no credentials)")
    return False
