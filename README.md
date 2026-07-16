# Bangkit — Multi-Agent AI Learning Platform

A full-stack exam-prep platform for Malaysian SPM students, re-architected from a
Next.js app that called LLM APIs directly into a **multi-agent GenAI system**.

**Live demo:** https://alphaplus-lime.vercel.app/ · **Design doc:** [ARCHITECTURE.md](./ARCHITECTURE.md)

## Architecture

A Python service (FastAPI + LangGraph) hosts a **supervisor agent** that classifies
intent, extracts subject/chapter scope, and decomposes multi-step requests into an
ordered plan, then routes to **tutor**, **quiz-generation**, and **marking** agents —
each grounded by a RAG pipeline over curriculum content and digitized SPM past papers.
The Next.js frontend delegates AI work to the service via an opt-in, fall-back-safe
integration.

```
Next.js frontend  ──►  Python AI service (FastAPI + LangGraph, Docker)
                        supervisor → retrieve → { tutor | quiz | marker }
                        backed by: vector store (RAG) · Groq router · LangSmith
```

## Highlights

- **Agentic orchestration** — supervisor performs task decomposition, planning, and
  step-by-step execution (LangGraph).
- **RAG with citations** — markdown-aware chunking, BGE embeddings, metadata-filtered
  retrieval; answers cite the exact chapter and section.
- **Schema-validated output** — Pydantic contracts with a self-healing repair step for
  quiz and marking agents.
- **Resilient LLM layer** — multi-model fallback with exponential-backoff cooldown.
- **"TDD for agents"** — golden-dataset evaluation harness (marking accuracy,
  groundedness) running in CI, with optional LangSmith tracing.
- **Production-ready** — multi-stage Docker, GitHub Actions CI, API-key auth + CORS,
  and a cloud deploy pipeline (Azure Container Apps / AWS App Runner — same image).

## Repository layout

| Path | Contents |
|---|---|
| `ai-service/` | Python multi-agent service (FastAPI + LangGraph), RAG, evals, Docker |
| `ai-service/ARCHITECTURE.md` *(root)* | Full design & migration doc |
| `ai-service/DEPLOY.md` | Local run + cloud deployment guide |
| `web/` | Next.js frontend (delegates to the AI service when configured) |

## Quickstart (AI service)

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env          # add GROQ_API_KEY
python -m app.rag.ingest      # build the vector store
uvicorn app.main:app --reload
pytest -q                     # run the suite + eval smoke
```

## Tech stack

**AI service:** Python, FastAPI, LangGraph, Pydantic ·
**RAG:** BGE embeddings (FastEmbed), metadata-filtered vector store, LangSmith ·
**LLM:** Groq SDK (Llama 3.3 70B), multi-model fallback router ·
**Frontend:** Next.js (App Router), React, Tailwind CSS ·
**Infra:** Docker, GitHub Actions, Azure Container Apps / AWS App Runner
