from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env", override=False)

APP_ENV = os.getenv("APP_ENV", "local").lower()
CORS_DEV_DEFAULTS = ("http://localhost:3000", "http://127.0.0.1:3000")


def parse_csv_env(value: str | None, fallback: tuple[str, ...]) -> tuple[str, ...]:
    if value is None:
        return fallback

    parsed = tuple(origin.strip() for origin in value.split(",") if origin.strip())
    if parsed:
        return parsed

    return fallback


@dataclass(frozen=True)
class Settings:
    app_environment: str = os.getenv("APP_ENV", "local")
    app_name: str = os.getenv("NEXT_PUBLIC_APP_NAME", "Tepic Catalog")
    database_url: str = os.getenv("DATABASE_URL", "")
    cors_allowed_origins: tuple[str, ...] = parse_csv_env(
        os.getenv("BACKEND_CORS_ORIGINS"),
        CORS_DEV_DEFAULTS if APP_ENV == "local" else (),
    )
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
