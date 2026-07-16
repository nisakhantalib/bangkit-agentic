# Bangkit v2 — Agentic Refactor: Architecture & Migration Plan

**Goal:** Evolve Bangkit from "Next.js app that calls LLM APIs" into a **multi-agent GenAI system** with a Python orchestration layer, RAG over curriculum content, systematic evaluation, and containerized cloud deployment.

**Why:** Targets the EY GenAI Engineer profile: multi-agentic workflows (task decomposition, planning, execution), LangGraph/LangSmith, Python full-stack, RAG over unstructured data, Docker, cloud, CI/CD.

---

## 1. Target architecture

```
┌─────────────────────┐
│  Next.js frontend    │  (existing, stays on Vercel)
│  chat / quiz / graph │
└──────────┬──────────┘
           │ HTTPS (REST + SSE streaming)
┌──────────▼──────────────────────────────────────┐
│  Python AI Service — FastAPI + LangGraph         │
│  (Docker container on AWS App Runner)            │
│                                                  │
│   ┌────────────────┐                             │
│   │ Supervisor      │  intent classification +   │
│   │ (router/planner)│  task decomposition        │
│   └───┬────┬────┬───┘                            │
│       │    │    │                                │
│   ┌───▼─┐ ┌▼───────┐ ┌▼──────┐                   │
│   │Tutor│ │Quiz gen│ │Marker │   agent nodes     │
│   └──┬──┘ └───┬────┘ └──┬────┘                   │
│      └── retrieval tool (RAG) ──┐                │
└──────────┬──────────┬───────────┼────────────────┘
           │          │           │
     ┌─────▼────┐ ┌───▼─────┐ ┌───▼────────┐
     │ Vector DB│ │ Groq     │ │ LangSmith  │
     │ (RAG)    │ │ router   │ │ trace/eval │
     └──────────┘ └──────────┘ └────────────┘
```

**Key decision:** the Next.js app is untouched except for pointing its AI calls at the new service. The refactor story is "extracted the AI layer into a standalone multi-agent Python service."

---

## 2. New repo structure

```
bangkit2/
├── web/                        # existing Next.js app (moved here)
├── ai-service/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint
│   │   ├── api/
│   │   │   ├── chat.py         # POST /v1/chat  (SSE streaming)
│   │   │   ├── quiz.py         # POST /v1/quiz/generate, /v1/quiz/mark
│   │   │   └── health.py       # GET /health
│   │   ├── graph/
│   │   │   ├── state.py        # LangGraph state schema
│   │   │   ├── supervisor.py   # router + planner node
│   │   │   ├── tutor.py        # tutor agent node
│   │   │   ├── quiz_gen.py     # quiz generator node
│   │   │   ├── marker.py       # marking node
│   │   │   └── build.py        # graph assembly + compile
│   │   ├── rag/
│   │   │   ├── ingest.py       # chunk + embed curriculum & past papers
│   │   │   ├── retriever.py    # vector search + reranking
│   │   │   └── chunking.py     # markdown-aware chunking
│   │   ├── llm/
│   │   │   ├── router.py       # multi-model fallback + cooldown (ported from TS)
│   │   │   └── models.py       # Groq model registry
│   │   ├── schemas/            # Pydantic models (quiz, marking, plans)
│   │   └── guards/             # input validation, scope check, output schema repair
│   ├── evals/
│   │   ├── datasets/           # golden sets (marking pairs, tutor Q&A)
│   │   ├── test_marking.py     # marking accuracy eval
│   │   └── test_tutor.py       # groundedness / relevance eval
│   ├── tests/                  # unit tests (pytest)
│   ├── Dockerfile
│   ├── pyproject.toml          # uv or poetry
│   └── .env.example
├── docker-compose.yml          # local dev: ai-service + chroma
├── .github/workflows/ci.yml    # lint, test, eval smoke, docker build
└── ARCHITECTURE.md             # this file
```

---

## 3. LangGraph design

### 3.1 State schema (`graph/state.py`)

```python
from typing import Annotated, Literal, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class TutorState(TypedDict):
    messages: Annotated[list, add_messages]   # conversation history
    intent: Optional[Literal["tutor", "quiz", "mark", "plan"]]
    plan: Optional[list[str]]                 # decomposed steps from supervisor
    subject: Optional[str]                    # "sains" | "matematik"
    chapter: Optional[str]
    retrieved_docs: Optional[list[dict]]      # RAG context with source metadata
    quiz_spec: Optional[dict]                 # validated QuizSpec
    marking_result: Optional[dict]            # validated MarkingResult
    error: Optional[str]
```

### 3.2 Nodes

| Node | Responsibility | Output |
|---|---|---|
| **supervisor** | Classify intent, extract subject/chapter, decompose multi-step requests ("revise ch. 4 then quiz me") into an ordered plan | `intent`, `plan` |
| **retrieve** | Query vector store, filter by subject/chapter metadata, return top-k chunks with citations | `retrieved_docs` |
| **tutor** | Answer grounded in retrieved context; cite chapter/section; refuse out-of-syllabus | assistant message |
| **quiz_gen** | Generate MCQ/structured questions from retrieved chunks; validate against `QuizSpec` Pydantic schema; retry with repair prompt on validation failure | `quiz_spec` |
| **marker** | Grade student answers against rubric; structured `MarkingResult` (score, per-criterion feedback, model answer) | `marking_result` |

### 3.3 Edges

- `START → supervisor`
- `supervisor → retrieve` (conditional: all intents except pure chit-chat)
- `retrieve → {tutor | quiz_gen | marker}` (conditional on `intent`)
- Multi-step plans: supervisor loops — after a node completes, control returns to supervisor, which pops the next plan step or ends. This is the "task decomposition, planning and execution" story.
- `{tutor | quiz_gen | marker} → END` when plan is empty

### 3.4 Structured output discipline

Every non-chat node returns a **Pydantic-validated** object. On validation failure: one retry with the validation errors injected into a repair prompt, then graceful degradation. (This replaces the "robust JSON parsing" from v1 with a proper contract — call this out in interviews.)

---

## 4. LLM layer (`llm/router.py`)

Port the existing TypeScript fallback/cooldown logic to Python:

- Model registry: `llama-3.3-70b-versatile` (primary), 1–2 fallbacks (e.g. `llama-3.1-8b-instant` for cheap nodes like intent classification)
- Per-model cooldown after 429/5xx with exponential backoff
- **Model-per-node assignment:** supervisor uses the small fast model, tutor/marker use 70B — this is a cost/latency optimization worth mentioning
- Implement as a LangChain `Runnable` wrapper (or use `.with_fallbacks()`) so LangSmith traces capture fallback events

---

## 5. RAG pipeline (`rag/`)

| Decision | Choice | Rationale |
|---|---|---|
| Chunking | Markdown-header-aware splitting (~500 tokens, 50 overlap), preserve `subject/chapter/subchapter/difficulty` as metadata | Content is already structured markdown |
| Embeddings | `BAAI/bge-small-en-v1.5` via FastEmbed (local, free) — or `bge-m3` if Malay retrieval quality is poor | No embedding API dependency; multilingual option available |
| Vector store | Chroma (dev, docker-compose) → pgvector on Supabase free tier (prod) | Stateless prod container; free |
| Retrieval | Top-k=6 with metadata filtering by subject/chapter; optional rerank later | Simple, explainable |
| Past papers | Ingest digitized SPM papers + marking schemes as a separate collection; marker node retrieves matching scheme excerpts | Turns existing assets into the "unstructured data" story |

Ingestion is a CLI script (`python -m app.rag.ingest ./content`) run at build time or on demand.

---

## 6. API contract

| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/v1/chat` | POST | `{session_id, message, subject?, chapter?}` | SSE stream: `plan` event → token stream → `sources` event |
| `/v1/quiz/generate` | POST | `{subject, chapter, difficulty, n_questions, types[]}` | `QuizSpec` JSON |
| `/v1/quiz/mark` | POST | `{quiz_id, answers[]}` | `MarkingResult` JSON |
| `/health` | GET | — | `{status, models_available[]}` |

Auth: single shared API key header from the Next.js server (server-to-server only; never exposed to browser).

---

## 7. Observability & evaluation ("TDD for agents")

- **LangSmith tracing** on every graph run: node latencies, token usage, fallback events, retrieval hits
- **Golden datasets** (`evals/datasets/`):
  - `marking_golden.jsonl` — ~50 (question, student answer, expected score, expected feedback themes) pairs
  - `tutor_golden.jsonl` — ~30 (question, must-cite chapter, must-include facts) pairs
- **Metrics:** marking = exact score agreement + within-±1-mark rate; tutor = groundedness (answer supported by retrieved chunks) + citation correctness
- **Harness:** pytest-based, runs a cheap smoke subset in CI, full set manually before releases; results logged to LangSmith datasets
- **Framing for interviews/portfolio:** "I applied the same discipline from my Playwright CI suites to LLM outputs — regression evals that catch quality drift before deploy."

---

## 8. Containerization & deployment

- **Dockerfile:** multi-stage (uv install → slim runtime), non-root user, healthcheck
- **docker-compose.yml:** `ai-service` + `chroma` for local dev
- **Prod:** AWS App Runner (simplest container deploy, plays to the AWS SAA cert) — alternative: ECS Fargate if you want the deeper AWS story
- **Frontend:** stays on Vercel; env var `AI_SERVICE_URL` points Next.js API routes (now thin proxies) at App Runner
- **Secrets:** AWS SSM Parameter Store / App Runner env config

---

## 9. CI/CD (`.github/workflows/ci.yml`)

On every push: `ruff` lint → `pytest` unit tests → eval smoke subset → `docker build`.
On merge to `main`: push image to ECR → deploy to App Runner.

---

## 10. Milestones

| # | Milestone | Est. effort | Definition of done |
|---|---|---|---|
| 1 | Repo restructure + FastAPI skeleton + Python model router w/ fallback | 1–2 days | `/health` returns available models; unit tests for cooldown logic pass |
| 2 | RAG ingestion + retriever | 1–2 days | CLI ingests curriculum; retrieval returns correct chapter chunks in tests |
| 3 | LangGraph graph (supervisor + tutor first, then quiz_gen + marker) | 2–3 days | Multi-step request produces a visible plan and executes it end-to-end |
| 4 | LangSmith + eval harness | 1–2 days | Marking eval reports a baseline score; traces visible in LangSmith |
| 5 | Docker + AWS deploy + CI | 1–2 days | Live URL; green pipeline badge |
| 6 | Frontend wiring + streaming | 1 day | Production app uses the new service |
| 7 | Portfolio + resume rewrite | 1 day | New Bangkit write-up, architecture diagram, updated bullets |

---

## 11. Resume bullets this unlocks (write code to make these true)

- "Re-architected the AI layer of a production learning platform into a **multi-agent LangGraph service** (Python/FastAPI) performing task decomposition, planning, and execution across tutor, quiz-generation, and marking agents"
- "Built a **RAG pipeline** over curriculum content and digitized SPM past papers (markdown-aware chunking, BGE embeddings, pgvector), grounding tutor responses with chapter-level citations"
- "Implemented **LLM evaluation harness** with LangSmith tracing and golden datasets, measuring marking accuracy and answer groundedness in CI"
- "**Containerized and deployed** the service with Docker on AWS App Runner with GitHub Actions CI/CD"
