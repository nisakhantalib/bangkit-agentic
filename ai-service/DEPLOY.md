# Deployment — AWS App Runner via ECR

The service ships as a container. CI builds and tests it on every push; the
deploy workflow pushes to ECR and deploys to App Runner. Deploy stays dormant
until you enable it, so it's safe to merge first.

## Local
```bash
# from repo root (Docker context must include web/data for the corpus stage)
docker build -f ai-service/Dockerfile -t bangkit-ai-service .
docker run -p 8000:8000 --env-file ai-service/.env bangkit-ai-service
curl localhost:8000/health
```

Or with compose: `docker compose up --build`.

## Production config (env vars on App Runner)
| Var | Purpose |
|---|---|
| `GROQ_API_KEY` | LLM access (store in App Runner secret / SSM) |
| `EMBEDDER` | `fastembed` for BGE-quality retrieval in prod |
| `SERVICE_API_KEY` | shared key; the Next.js server sends it as `X-API-Key` |
| `CORS_ORIGINS` | your Vercel domain(s), comma-separated |
| `LANGCHAIN_TRACING_V2` / `LANGCHAIN_API_KEY` | optional LangSmith tracing |

## One-time AWS setup
1. Create an ECR repository (e.g. `bangkit-ai-service`).
2. Create two IAM roles:
   - a GitHub OIDC deploy role (ECR push + App Runner deploy),
   - an App Runner ECR access role.
3. In the GitHub repo, set:
   - **Variables:** `DEPLOY_ENABLED=true`, `AWS_REGION`, `ECR_REPOSITORY`
   - **Secrets:** `AWS_DEPLOY_ROLE_ARN`, `AWS_APPRUNNER_ACCESS_ROLE_ARN`
4. Push to `master` (or run the workflow manually) — the deploy job builds,
   pushes, and rolls out. App Runner gives you an HTTPS URL.

## Wiring the frontend
Point the Next.js API routes at the App Runner URL via `AI_SERVICE_URL`, and
send `X-API-Key: $SERVICE_API_KEY` on server-to-server calls (never expose it to
the browser). See Milestone 6.
