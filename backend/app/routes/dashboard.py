"""
Dashboard and analytics routes.
"""
from fastapi import APIRouter
from app.schemas.prediction import DashboardStats, ChartData
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats, summary="Get summary statistics for prediction history")
def get_dashboard_stats():
    return prediction_service.get_dashboard_stats()

@router.get("/chart-data", response_model=ChartData, summary="Get chart-ready data for visualizations")
def get_chart_data():
    return prediction_service.get_chart_data()

