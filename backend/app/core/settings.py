from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[3]
load_dotenv(ROOT_DIR / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    app_environment: str = os.getenv("APP_ENV", "local")
    app_name: str = os.getenv("NEXT_PUBLIC_APP_NAME", "Tepic Catalog")
    database_url: str = os.getenv("DATABASE_URL", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
