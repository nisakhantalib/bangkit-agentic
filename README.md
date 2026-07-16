# Bangkit v2 — Multi-Agent AI Learning Platform

Agentic refactor of [Bangkit](https://alphaplus-lime.vercel.app/): extracting the AI layer into a standalone Python multi-agent service built with FastAPI + LangGraph, with RAG over SPM curriculum content, LangSmith evaluation, and containerized AWS deployment.

**Design doc:** [ARCHITECTURE.md](./ARCHITECTURE.md)

## Structure
- `web/` — Next.js frontend (existing app)
- `ai-service/` — Python AI service (FastAPI + LangGraph)

## Quickstart (ai-service)
```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # add your GROQ_API_KEY
uvicorn app.main:app --reload
```

Run tests: `pytest`

## Frontend ↔ AI service integration

The `web/` app works standalone against Groq by default. To route tutor chat
through the Python multi-agent service, set in `web/.env`:

```
AI_SERVICE_URL=<deployed service URL>
AI_SERVICE_API_KEY=<shared service key>
```

With these unset, behaviour is unchanged (strangler-fig migration). See
`ai-service/DEPLOY.md` for deploying the service.
