"""
Integration tests for FastAPI endpoints.
"""
import pytest

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_ready"] is True
    assert "timestamp" in data

def test_model_metrics_endpoint(client):
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "model_name" in data
    assert "validation_metrics" in data
    assert "rmse" in data["validation_metrics"]
    assert "r2" in data["validation_metrics"]
    assert data["validation_metrics"]["rmse"] > 0
    assert "features" in data

def test_prediction_endpoint_success(client, clean_predictions, valid_house_payload):
    response = client.post("/api/predict", json=valid_house_payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["predicted_price"] > 0
    assert data["model_version"] == "1.0.0"
    assert data["input_features"]["OverallQual"] == 7

def test_prediction_endpoint_validation_errors(client, valid_house_payload):
    # Case 1: Invalid OverallQual (< 1)
    bad_payload = valid_house_payload.copy()
    bad_payload["OverallQual"] = 0
    response = client.post("/api/predict", json=bad_payload)
    assert response.status_code == 422

    # Case 2: Invalid Neighborhood
    bad_payload = valid_house_payload.copy()
    bad_payload["Neighborhood"] = "Atlantis"
    response = client.post("/api/predict", json=bad_payload)
    assert response.status_code == 422
    assert "Invalid neighborhood" in response.text

    # Case 3: Remodel year earlier than built year
    bad_payload = valid_house_payload.copy()
    bad_payload["YearBuilt"] = 2010
    bad_payload["YearRemodAdd"] = 1990
    response = client.post("/api/predict", json=bad_payload)
    assert response.status_code == 422

def test_prediction_history_and_deletion(client, clean_predictions, valid_house_payload):
    # Post one prediction
    post_resp = client.post("/api/predict", json=valid_house_payload)
    assert post_resp.status_code == 201
    pred_id = post_resp.json()["id"]

    # Get predictions list
    list_resp = client.get("/api/predictions")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] == 1
    assert list_data["items"][0]["id"] == pred_id

    # Get single prediction
    single_resp = client.get(f"/api/predictions/{pred_id}")
    assert single_resp.status_code == 200
    assert single_resp.json()["id"] == pred_id

    # Delete prediction
    del_resp = client.delete(f"/api/predictions/{pred_id}")
    assert del_resp.status_code == 200

    # Ensure 404 after deletion
    after_resp = client.get(f"/api/predictions/{pred_id}")
    assert after_resp.status_code == 404

def test_dashboard_endpoints(client, clean_predictions, valid_house_payload):
    # Stats empty
    empty_stats = client.get("/api/dashboard/stats")
    assert empty_stats.status_code == 200
    assert empty_stats.json()["total_predictions"] == 0

    # Create prediction
    client.post("/api/predict", json=valid_house_payload)

    # Stats populated
    stats = client.get("/api/dashboard/stats")
    assert stats.status_code == 200
    assert stats.json()["total_predictions"] == 1
    assert stats.json()["avg_price"] > 0

    # Chart data
    charts = client.get("/api/dashboard/chart-data")
    assert charts.status_code == 200
    chart_data = charts.json()
    assert len(chart_data["price_distribution"]) == 5
    assert len(chart_data["recent_activity"]) == 1

