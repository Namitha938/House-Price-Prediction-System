"""
Tests for Machine Learning pipeline, data preprocessing, and inference.
"""
from pathlib import Path
import pytest
import pandas as pd
from app.ml.data_preprocessing import (
    get_preprocessor,
    load_and_validate_raw_data,
    ALL_FEATURES,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET_COLUMN
)
from app.ml.predict import HousePricePredictor, get_predictor

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "train.csv"
MODEL_PATH = BASE_DIR / "models" / "house_price_pipeline.joblib"

def test_raw_data_loading_and_features():
    assert RAW_DATA_PATH.exists(), f"Raw training data missing at {RAW_DATA_PATH}"
    X, y = load_and_validate_raw_data(RAW_DATA_PATH)
    assert len(X) == 1460, f"Expected 1460 rows, got {len(X)}"
    assert y.name == TARGET_COLUMN
    for col in ALL_FEATURES:
        assert col in X.columns

def test_preprocessor_transformation(valid_house_payload):
    preprocessor = get_preprocessor()
    df = pd.DataFrame([valid_house_payload])[ALL_FEATURES]
    # Fitting on a small slice
    transformed = preprocessor.fit_transform(df)
    assert transformed.shape[0] == 1
    assert transformed.shape[1] > len(NUMERICAL_FEATURES)

def test_trained_pipeline_inference(valid_house_payload):
    assert MODEL_PATH.exists(), f"Model artifact missing at {MODEL_PATH}"
    predictor = get_predictor()
    assert predictor.is_ready()
    
    preds = predictor.predict(valid_house_payload)
    assert len(preds) == 1
    predicted_price = preds[0]
    assert isinstance(predicted_price, float)
    assert predicted_price > 50000.0, f"Unrealistically low price: {predicted_price}"
    assert predicted_price < 1000000.0, f"Unrealistically high price: {predicted_price}"

def test_missing_feature_raises_error(valid_house_payload):
    predictor = get_predictor()
    incomplete = valid_house_payload.copy()
    del incomplete["OverallQual"]
    with pytest.raises(ValueError) as exc:
        predictor.predict(incomplete)
    assert "Missing required model features" in str(exc.value)

def test_missing_model_file_raises_error():
    non_existent = Path("non_existent_model.joblib")
    with pytest.raises(FileNotFoundError):
        HousePricePredictor(non_existent)

