"""
Prediction and history API routes.
"""
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.prediction import (
    HouseFeaturesInput,
    PredictionResponse,
    PredictionHistoryRecord,
    PaginatedPredictions
)
from app.services.prediction_service import prediction_service

router = APIRouter(tags=["Predictions"])

@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate and persist house price prediction (POST /api/predict)"
)
@router.post(
    "/predictions",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate and persist house price prediction (POST /api/predictions)"
)
def predict_price(input_data: HouseFeaturesInput):
    try:
        return prediction_service.create_prediction(input_data)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference failure: {str(e)}"
        )

@router.get(
    "/predictions",
    response_model=PaginatedPredictions,
    summary="Get paginated history of predictions"
)
def get_prediction_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page")
):
    return prediction_service.get_predictions(page=page, page_size=page_size)

@router.get(
    "/predictions/{prediction_id}",
    response_model=PredictionHistoryRecord,
    summary="Get single prediction by ID"
)
def get_prediction_by_id(prediction_id: str):
    record = prediction_service.get_prediction_by_id(prediction_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction with ID '{prediction_id}' was not found."
        )
    return record

@router.delete(
    "/predictions/{prediction_id}",
    summary="Delete prediction record by ID"
)
def delete_prediction(prediction_id: str):
    deleted = prediction_service.delete_prediction(prediction_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction with ID '{prediction_id}' was not found."
        )
    return {"message": "Prediction record deleted successfully.", "id": prediction_id}

