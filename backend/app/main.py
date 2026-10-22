"""
Main FastAPI Application entrypoint.
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db, close_mongo_connection
from app.ml.predict import get_predictor
from app.routes import health, predictions, dashboard, auth

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize MongoDB indexes and preload model
    logger.info("Initializing application resources...")
    try:
        init_db()
    except Exception as e:
        logger.error(f"Error initializing MongoDB: {e}")

    try:
        predictor = get_predictor()
        if predictor.is_ready():
            logger.info("House price ML pipeline loaded and ready.")
        else:
            logger.warning("ML pipeline could not be loaded at startup.")
    except Exception as e:
        logger.warning(f"ML pipeline initialization notice: {e}")

    yield

    # Shutdown: Clean up connections
    logger.info("Closing database connections...")
    close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Professional Full-Stack ML House Price Valuation API backed by Kaggle Ames Housing Dataset & MongoDB",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please verify your inputs and try again."}
    )

