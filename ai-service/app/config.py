from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = ""
    environment: str = "dev"

    # "hashing" (offline, dev/CI) or "fastembed" (BGE, production quality)
    embedder: str = "hashing"  # reliable default; set "fastembed" for BGE-quality

    # Comma-separated allowed origins for CORS; empty = same-origin only
    cors_origins: str = ""

    # If set, all /v1/* endpoints require X-API-Key to match (server-to-server auth)
    service_api_key: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
