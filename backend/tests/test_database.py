"""
Tests for MongoDB prediction service, data persistence, and stats calculations.
"""
import pytest
from app.schemas.prediction import HouseFeaturesInput
from app.services.prediction_service import prediction_service

def test_empty_database_dashboard_stats(clean_predictions):
    stats = prediction_service.get_dashboard_stats()
    assert stats.total_predictions == 0
    assert stats.avg_price == 0.0
    assert stats.min_price == 0.0
    assert stats.max_price == 0.0
    assert stats.latest_prediction is None

def test_empty_database_chart_data(clean_predictions):
    chart = prediction_service.get_chart_data()
    assert len(chart.price_distribution) == 0
    assert len(chart.quality_vs_price) == 0
    assert len(chart.neighborhood_distribution) == 0
    assert len(chart.recent_activity) == 0

def test_prediction_creation_and_persistence(clean_predictions, valid_house_payload):
    inp = HouseFeaturesInput(**valid_house_payload)
    resp = prediction_service.create_prediction(inp)
    
    assert resp.id is not None
    assert resp.predicted_price > 0
    assert resp.model_version == "1.0.0"

    # Query directly from collection
    doc = clean_predictions.find_one()
    assert doc is not None
    assert doc["predicted_price"] == resp.predicted_price
    assert doc["neighborhood"] == "CollgCr"

def test_prediction_retrieval_and_deletion(clean_predictions, valid_house_payload):
    inp = HouseFeaturesInput(**valid_house_payload)
    resp = prediction_service.create_prediction(inp)

    # Retrieve by ID
    record = prediction_service.get_prediction_by_id(resp.id)
    assert record is not None
    assert record.id == resp.id
    assert record.overall_qual == 7

    # Retrieve pagination
    paginated = prediction_service.get_predictions(page=1, page_size=10)
    assert paginated.total == 1
    assert len(paginated.items) == 1

    # Delete
    deleted = prediction_service.delete_prediction(resp.id)
    assert deleted is True

    # Confirm deletion
    record_after = prediction_service.get_prediction_by_id(resp.id)
    assert record_after is None
    assert clean_predictions.count_documents({}) == 0

def test_populated_dashboard_stats_and_charts(clean_predictions, valid_house_payload):
    # Insert multiple predictions with different qualities
    payload1 = valid_house_payload.copy()
    payload1["OverallQual"] = 5
    prediction_service.create_prediction(HouseFeaturesInput(**payload1))

    payload2 = valid_house_payload.copy()
    payload2["OverallQual"] = 9
    prediction_service.create_prediction(HouseFeaturesInput(**payload2))

    stats = prediction_service.get_dashboard_stats()
    assert stats.total_predictions == 2
    assert stats.avg_price > 0
    assert stats.min_price <= stats.max_price
    assert stats.common_neighborhood == "CollgCr"

    charts = prediction_service.get_chart_data()
    assert len(charts.price_distribution) == 5
    assert len(charts.quality_vs_price) > 0
    assert len(charts.recent_activity) == 2

