"""Application configuration loaded from environment variables."""
import os
from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_database_url() -> str:
    """SQLite default. On Vercel the only writable path is /tmp."""
    if os.getenv("VERCEL"):
        return "sqlite:////tmp/stok.db"
    return "sqlite:///./stok.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    APP_NAME: str = "Stok API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = True

    SECRET_KEY: str = Field(
        default="change-me-in-production-please-use-a-long-random-string",
        min_length=32,
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = Field(default_factory=_default_database_url)

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    LOW_STOCK_DEFAULT_THRESHOLD: int = 10

    FIRST_SUPERUSER_EMAIL: str = "admin@stok.local"
    FIRST_SUPERUSER_PASSWORD: str = "admin12345"
    FIRST_SUPERUSER_FULL_NAME: str = "System Administrator"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
