"""
Model training and evaluation pipeline for House Price Prediction.
Compares multiple models, validates against an honest test split, and persists the best pipeline.
"""
import json
import logging
from datetime import datetime, timezone
import sys
from pathlib import Path

# Ensure backend root is on sys.path when script is executed directly
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from typing import Dict, Any
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

from app.ml.data_preprocessing import (
    load_and_validate_raw_data,
    get_preprocessor,
    ALL_FEATURES,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "train.csv"
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"
PIPELINE_OUTPUT_PATH = MODELS_DIR / "house_price_pipeline.joblib"
METADATA_OUTPUT_PATH = MODELS_DIR / "model_metadata.json"

def calculate_metrics(y_true, y_pred) -> Dict[str, float]:
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_true, y_pred)
    return {
        "mae": round(float(mae), 2),
        "rmse": round(float(rmse), 2),
        "r2": round(float(r2), 4),
    }

def generate_data_summary(X: pd.DataFrame, y: pd.Series) -> Dict[str, Any]:
    summary = {
        "total_samples": int(len(X)),
        "features_count": int(X.shape[1]),
        "numerical_features": NUMERICAL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_stats": {
            "min": float(y.min()),
            "max": float(y.max()),
            "mean": round(float(y.mean()), 2),
            "median": round(float(y.median()), 2),
            "std": round(float(y.std()), 2),
        },
        "neighborhoods": sorted(X["Neighborhood"].dropna().unique().tolist()),
        "bldg_types": sorted(X["BldgType"].dropna().unique().tolist()),
        "house_styles": sorted(X["HouseStyle"].dropna().unique().tolist()),
    }
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    summary_path = PROCESSED_DATA_DIR / "data_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    logger.info("Exploratory data summary saved to %s", summary_path)
    return summary

def train_and_evaluate(data_path: Path = RAW_DATA_PATH) -> Dict[str, Any]:
    logger.info("Loading dataset from %s", data_path)
    X, y = load_and_validate_raw_data(data_path)
    
    # Save dataset summary
    summary = generate_data_summary(X, y)

    # 80/20 train/validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    logger.info("Dataset split into %d training samples and %d validation samples", len(X_train), len(X_val))

    candidate_models = {
        "DummyRegressor (Baseline)": DummyRegressor(strategy="median"),
        "Ridge Regression": Ridge(alpha=10.0, random_state=42),
        "Random Forest Regressor": RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42),
        "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=150, learning_rate=0.08, max_depth=4, random_state=42),
    }

    evaluations: Dict[str, Dict[str, float]] = {}
    fitted_pipelines: Dict[str, Pipeline] = {}

    for name, regressor in candidate_models.items():
        logger.info("Training candidate model: %s", name)
        preprocessor = get_preprocessor()
        pipeline = Pipeline([
            ("preprocessor", preprocessor),
            ("regressor", regressor),
        ])
        # Fit on training data ONLY to prevent leakage
        pipeline.fit(X_train, y_train)
        y_val_pred = pipeline.predict(X_val)
        
        metrics = calculate_metrics(y_val, y_val_pred)
        evaluations[name] = metrics
        fitted_pipelines[name] = pipeline
        logger.info("[%s] Validation MAE: $%.2f | RMSE: $%.2f | R2: %.4f", name, metrics["mae"], metrics["rmse"], metrics["r2"])

    # Select best model based on validation RMSE
    best_model_name = min(evaluations, key=lambda k: evaluations[k]["rmse"])
    best_metrics = evaluations[best_model_name]
    logger.info("Best model selected: '%s' with RMSE: $%.2f and R2: %.4f", best_model_name, best_metrics["rmse"], best_metrics["r2"])

    best_pipeline = fitted_pipelines[best_model_name]

    # Save artifacts
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_pipeline, PIPELINE_OUTPUT_PATH)
    logger.info("Saved serialized model pipeline to %s", PIPELINE_OUTPUT_PATH)

    metadata = {
        "model_name": best_model_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "evaluation_metric": "RMSE",
        "validation_metrics": best_metrics,
        "candidate_comparisons": evaluations,
        "features": {
            "all": ALL_FEATURES,
            "numerical": NUMERICAL_FEATURES,
            "categorical": CATEGORICAL_FEATURES,
        },
        "dataset_info": {
            "source": "Kaggle: House Prices - Advanced Regression Techniques",
            "samples_total": len(X),
            "samples_train": len(X_train),
            "samples_val": len(X_val),
        },
        "version": "1.0.0",
    }

    with open(METADATA_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    logger.info("Saved model metadata to %s", METADATA_OUTPUT_PATH)

    return metadata

if __name__ == "__main__":
    train_and_evaluate()
