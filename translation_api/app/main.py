"""
Application entrypoint.

Wires together the FastAPI app, the API router, and the ML model
lifecycle. Run with:

    uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.endpoints import router as translation_router
from app.ml.model import TranslationArchitecture

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown.

    On startup: load the fastText + NLLB models once and attach the
    resulting TranslationArchitecture instance to app.state, so every
    request handler can reuse it without reloading anything.

    On shutdown: nothing to clean up explicitly here — PyTorch/Python
    will release memory on process exit — but this is the place to add
    cleanup (e.g., closing DB connections) if the app grows.
    """
    logger.info("Starting up: loading ML models (this may take a moment)...")
    app.state.translation_model = TranslationArchitecture()
    logger.info("Startup complete: models loaded and ready to serve requests.")

    yield  # --- application runs here, serving requests ---

    logger.info("Shutting down translation API.")


app = FastAPI(
    title="Multilingual-to-English Translation API",
    description="Detects the source language of input text and translates it into English using NLLB-200.",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(translation_router, tags=["Translation"])


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    """
    Basic liveness endpoint.

    Returns a simple status payload so load balancers / orchestration
    tools (e.g., Kubernetes probes) can confirm the process is up.
    Note: this does not confirm the models finished loading — for that,
    a request to /translate is the real readiness check.
    """
    return {"status": "ok"}