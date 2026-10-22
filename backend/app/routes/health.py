"""
Health check and model metrics endpoints.
"""
import json
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.schemas.prediction import HealthStatus, ModelMetricsResponse
from app.config import settings
from app.ml.predict import get_predictor

router = APIRouter(tags=["Health & Model"])

@router.get("/health", response_model=HealthStatus)
def get_health():
    predictor = get_predictor()
    model_ready = predictor.is_ready()
    return HealthStatus(
        status="healthy" if model_ready else "degraded",
        model_ready=model_ready,
        model_version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

@router.get("/model/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    metadata_path = Path(settings.METADATA_PATH)
    if not metadata_path.exists():
        raise HTTPException(
            status_code=503,
            detail="Model metadata not found. The model may need to be trained first."
        )
    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return ModelMetricsResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read model metadata: {str(e)}")

