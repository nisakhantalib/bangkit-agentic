import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.agent import router as agent_router
from app.api.health import router as health_router
from app.config import get_settings
from app.graph.build import build_graph
from app.graph.deps import GraphDeps
from app.llm.groq_client import groq_client
from app.llm.router import ModelRouter
from app.observability import configure_tracing
from app.rag.ingest import ingest
from app.rag.retriever import Retriever
from app.security import require_api_key

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _make_embedder(kind: str):
    if kind == "fastembed":
        try:
            from app.rag.embeddings import FastEmbedEmbedder

            return FastEmbedEmbedder()
        except Exception:  # missing package, model download failure, etc.
            logger.exception(
                "fastembed unavailable - falling back to hashing embedder "
                "(retrieval quality reduced; fix the image or unset EMBEDDER)"
            )
    from app.rag.embeddings import HashingEmbedder

    return HashingEmbedder()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_tracing()

    app = FastAPI(title="Bangkit AI Service", version="0.1.0")

    if settings.cors_origin_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origin_list,
            allow_methods=["POST", "GET"],
            allow_headers=["*"],
        )

    model_router = ModelRouter(client=groq_client)
    app.state.model_router = model_router

    embedder = _make_embedder(settings.embedder)
    try:
        store = ingest(embedder=embedder)
        logger.info("ingested %d chunks (embedder=%s)", len(store), settings.embedder)
    except FileNotFoundError:
        from app.rag.store import VectorStore

        store = VectorStore()
        logger.warning("no corpus found; retriever will return no results")
    retriever = Retriever(store, embedder)

    deps = GraphDeps(complete=model_router.complete, retriever=retriever)
    app.state.graph = build_graph(deps)

    app.include_router(health_router)
    app.include_router(agent_router, dependencies=[Depends(require_api_key)])
    return app


app = create_app()
