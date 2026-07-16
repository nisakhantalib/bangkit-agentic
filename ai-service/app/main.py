import logging

from fastapi import FastAPI

from app.api.agent import router as agent_router
from app.api.health import router as health_router
from app.graph.build import build_graph
from app.graph.deps import GraphDeps
from app.llm.groq_client import groq_client
from app.llm.router import ModelRouter
from app.observability import configure_tracing
from app.rag.embeddings import HashingEmbedder
from app.rag.ingest import ingest
from app.rag.retriever import Retriever

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    configure_tracing()
    app = FastAPI(title="Bangkit AI Service", version="0.1.0")

    model_router = ModelRouter(client=groq_client)
    app.state.model_router = model_router

    # RAG: hashing embedder keeps startup fast and offline for dev/CI;
    # production swaps in FastEmbedEmbedder via the same interface.
    embedder = HashingEmbedder()
    try:
        store = ingest(embedder=embedder)
        logger.info("ingested %d chunks into vector store", len(store))
    except FileNotFoundError:
        from app.rag.store import VectorStore

        store = VectorStore()
        logger.warning("no corpus found; retriever will return no results")
    retriever = Retriever(store, embedder)

    deps = GraphDeps(complete=model_router.complete, retriever=retriever)
    app.state.graph = build_graph(deps)

    app.include_router(health_router)
    app.include_router(agent_router)
    return app


app = create_app()
