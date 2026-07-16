from fastapi.testclient import TestClient

from app.main import create_app


def test_health_reports_models():
    app = create_app()
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "llama-3.3-70b-versatile" in body["models_available"]
