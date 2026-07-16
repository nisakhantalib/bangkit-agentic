"""Groq-backed LLM client conforming to the router's client interface."""

from __future__ import annotations

from app.config import get_settings
from app.llm.router import RetryableModelError


def groq_client(model_id: str, messages: list[dict], **kwargs) -> str:
    """Call Groq chat completions; raise RetryableModelError on transient failures."""
    from groq import (  # lazy import keeps unit tests SDK-free
        APIConnectionError,
        APIStatusError,
        Groq,
        RateLimitError,
    )

    client = Groq(api_key=get_settings().groq_api_key)
    try:
        response = client.chat.completions.create(
            model=model_id,
            messages=messages,
            temperature=kwargs.get("temperature", 0.7),
            max_tokens=kwargs.get("max_tokens", 1024),
        )
    except (RateLimitError, APIConnectionError) as exc:
        raise RetryableModelError(str(exc)) from exc
    except APIStatusError as exc:
        if exc.status_code >= 500:
            raise RetryableModelError(str(exc)) from exc
        raise
    return response.choices[0].message.content or ""
