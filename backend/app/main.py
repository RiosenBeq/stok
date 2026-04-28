"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.init_db import init_db

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("stok")


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    logger.info("Starting %s v%s (%s)", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)
    if settings.ENVIRONMENT == "production":
        if settings.SECRET_KEY.startswith("change-me"):
            logger.error("SECRET_KEY is using the default value. Set it via env in production.")
        if settings.FIRST_SUPERUSER_PASSWORD == "test123":
            logger.warning(
                "FIRST_SUPERUSER_PASSWORD is the default. Change it after first login."
            )
    init_db()
    yield
    logger.info("Shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="Gelişmiş Stok / Envanter Yönetim Sistemi",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def unhandled_exception(request: Request, exc: Exception):  # noqa: ARG001
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Sunucuda beklenmeyen bir hata oluştu"},
        )

    @app.get("/health", tags=["meta"])
    def health():
        return {"status": "ok", "version": settings.APP_VERSION}

    @app.get("/health/db", tags=["meta"])
    def health_db(db: Session = Depends(get_db)):
        try:
            db.execute(text("SELECT 1"))
            return {"status": "ok", "db": "reachable"}
        except Exception as exc:  # pragma: no cover
            logger.exception("DB health check failed")
            return JSONResponse(
                status_code=503,
                content={"status": "error", "db": "unreachable", "detail": str(exc)},
            )

    app.include_router(api_router)
    return app


app = create_app()
