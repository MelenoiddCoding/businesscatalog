from fastapi import FastAPI

from app.core.settings import get_settings


settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.1.0")


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "environment": settings.app_environment,
        "app_name": settings.app_name,
        "database_configured": bool(settings.database_url),
    }
