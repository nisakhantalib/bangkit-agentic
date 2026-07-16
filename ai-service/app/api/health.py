from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
def health(request: Request) -> dict:
    model_router = request.app.state.model_router
    return {
        "status": "ok",
        "models_available": model_router.available_models(),
    }
