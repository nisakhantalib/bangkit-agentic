# ---- Stage 1: build the curriculum corpus from web/ data with Node ----
FROM node:22-slim AS corpus
WORKDIR /build
COPY ai-service/scripts ./ai-service/scripts
COPY web/data ./web/data
RUN mkdir -p ai-service/corpus \
    && cd ai-service \
    && node scripts/run_export.mjs > corpus/curriculum.jsonl \
    && test -s corpus/curriculum.jsonl

# ---- Stage 2: Python runtime ----
FROM python:3.12-slim AS runtime
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /srv

COPY ai-service/pyproject.toml ./
COPY ai-service/app ./app
RUN pip install --no-cache-dir .

COPY --from=corpus /build/ai-service/corpus ./corpus

# Pre-bake the BGE embedding model so cold starts never download from the network
ENV FASTEMBED_CACHE_PATH=/srv/models
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5')"

RUN useradd --create-home appuser && chown -R appuser:appuser /srv
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status==200 else 1)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
