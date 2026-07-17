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


def _build_index(kind: str):
    """Build (embedder, store), guaranteeing a populated store when a corpus exists.

    fastembed downloads a model at first use and can fail on constrained hosts;
    if embedding/ingest fails for any reason, fall back to the dependency-free
    hashing embedder so retrieval still works (reduced quality) rather than the
    store coming up empty and every answer losing its grounding.
    """
    from app.rag.embeddings import HashingEmbedder

    def _try(embedder, label):
        store = ingest(embedder=embedder)
        logger.info("ingested %d chunks (embedder=%s)", len(store), label)
        return embedder, store

    if kind == "fastembed":
        try:
            from app.rag.embeddings import FastEmbedEmbedder

            return _try(FastEmbedEmbedder(), "fastembed")
        except FileNotFoundError:
            logger.warning("no corpus found; retriever will return no results")
            from app.rag.store import VectorStore

            return HashingEmbedder(), VectorStore()
        except Exception:
            logger.exception("fastembed failed; falling back to hashing embedder")

    try:
        return _try(HashingEmbedder(), "hashing")
    except FileNotFoundError:
        logger.warning("no corpus found; retriever will return no results")
        from app.rag.store import VectorStore

        return HashingEmbedder(), VectorStore()


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

    embedder, store = _build_index(settings.embedder)
    retriever = Retriever(store, embedder)

    deps = GraphDeps(complete=model_router.complete, retriever=retriever)
    app.state.graph = build_graph(deps)

    app.include_router(health_router)
    app.include_router(agent_router, dependencies=[Depends(require_api_key)])
    return app


app = create_app()
