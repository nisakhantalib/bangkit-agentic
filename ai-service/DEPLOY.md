# Deployment — Azure Container Apps via ACR

The service ships as a container. CI builds and tests it on every push; the
deploy workflow builds in Azure Container Registry and rolls out to Azure
Container Apps. It stays dormant until `DEPLOY_ENABLED=true` is set.

Container Apps **scales to zero** — the demo costs ~nothing while idle
(ACR Basic is the only fixed cost, ~USD 5/month).

## Local
```bash
# from repo root (context must include web/data for the corpus stage)
docker build -f ai-service/Dockerfile -t bangkit-ai-service .
docker run -p 8000:8000 --env-file ai-service/.env bangkit-ai-service
curl localhost:8000/health
```

## Production env vars (set on the Container App)
| Var | Purpose |
|---|---|
| `GROQ_API_KEY` | LLM access (store as a Container Apps secret) |
| `EMBEDDER` | `fastembed` for BGE-quality retrieval |
| `SERVICE_API_KEY` | shared key; Next.js sends it as `X-API-Key` (secret) |
| `CORS_ORIGINS` | your Vercel domain(s), comma-separated |
| `LANGCHAIN_TRACING_V2` / `LANGCHAIN_API_KEY` | optional LangSmith tracing |

## One-time Azure setup (CLI)
```bash
# 0) login + names
az login
RG=bangkit-rg; LOC=southeastasia; ACR=bangkitacr$RANDOM; APP=bangkit-ai-service

# 1) resource group + registry + Container Apps environment
az group create -n $RG -l $LOC
az acr create -n $ACR -g $RG --sku Basic
az containerapp env create -n bangkit-env -g $RG -l $LOC

# 2) first image build (in the cloud, from your repo clone)
az acr build -r $ACR -t bangkit-ai-service:init -f ai-service/Dockerfile .

# 3) create the app (system identity pulls from ACR; scales to zero)
az containerapp create -n $APP -g $RG --environment bangkit-env \
  --image $ACR.azurecr.io/bangkit-ai-service:init \
  --registry-server $ACR.azurecr.io --registry-identity system \
  --ingress external --target-port 8000 \
  --min-replicas 0 --max-replicas 1 \
  --secrets groq-key=<GROQ_KEY> service-key=<RANDOM_SECRET> \
  --env-vars GROQ_API_KEY=secretref:groq-key SERVICE_API_KEY=secretref:service-key \
             EMBEDDER=fastembed CORS_ORIGINS=https://alphaplus-lime.vercel.app

# 4) GitHub OIDC identity for the deploy workflow
APP_ID=$(az ad app create --display-name bangkit-deploy --query appId -o tsv)
az ad sp create --id $APP_ID
az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "github-master",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:nisakhantalib/bangkit-agentic:ref:refs/heads/master",
  "audiences": ["api://AzureADTokenExchange"]
}'
SUB=$(az account show --query id -o tsv)
az role assignment create --assignee $APP_ID --role AcrPush \
  --scope $(az acr show -n $ACR --query id -o tsv)
az role assignment create --assignee $APP_ID --role Contributor \
  --scope /subscriptions/$SUB/resourceGroups/$RG
```

## GitHub configuration
- **Secrets:** `AZURE_CLIENT_ID` (= $APP_ID), `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`
- **Variables:** `DEPLOY_ENABLED=true`, `ACR_NAME`, `AZURE_RESOURCE_GROUP`, `CONTAINERAPP_NAME`

Then push to `master` (or run the workflow manually). The final step prints the
service URL: `https://<app>.<region>.azurecontainerapps.io`.

## Wiring the frontend
In Vercel project settings, set `AI_SERVICE_URL` to the Container App URL and
`AI_SERVICE_API_KEY` to the same value as `SERVICE_API_KEY`. Redeploy the
frontend; tutor chat now routes through the agent service (with automatic
fallback to the direct Groq path if the service is unreachable).

## Portability note
The image is cloud-agnostic: the previous AWS App Runner workflow
(`git log -- .github/workflows/deploy.yml`) deploys the identical image — the
platform choice is configuration, not architecture.
