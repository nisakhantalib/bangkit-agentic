import logging

from fastapi import FastAPI

from app.api.health import router as health_router
from app.llm.groq_client import groq_client
from app.llm.router import ModelRouter

logging.basicConfig(level=logging.INFO)


def create_app() -> FastAPI:
    app = FastAPI(title="Bangkit AI Service", version="0.1.0")
    app.state.model_router = ModelRouter(client=groq_client)
    app.include_router(health_router)
    return app


app = create_app()
