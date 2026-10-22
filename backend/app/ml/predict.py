"""
Inference module for House Price Prediction.
Loads serialized pipeline and validates feature schemas.
"""
import sys
from pathlib import Path
from typing import Dict, Any, Union, List
import pandas as pd
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.ml.data_preprocessing import ALL_FEATURES

PIPELINE_PATH = BASE_DIR / "models" / "house_price_pipeline.joblib"

class HousePricePredictor:
    def __init__(self, model_path: Path = PIPELINE_PATH):
        self.model_path = model_path
        self.pipeline = None
        self._load_model()

    def _load_model(self):
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Trained model artifact not found at {self.model_path}. "
                "Please run model training before making predictions."
            )
        self.pipeline = joblib.load(self.model_path)

    def is_ready(self) -> bool:
        return self.pipeline is not None and self.model_path.exists()

    def predict(self, input_data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> List[float]:
        if not self.is_ready():
            self._load_model()

        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        else:
            df = pd.DataFrame(input_data)

        # Validate that all required features exist in input dataframe
        missing_features = [f for f in ALL_FEATURES if f not in df.columns]
        if missing_features:
            raise ValueError(f"Missing required model features in input: {missing_features}")

        # Ensure correct column ordering matching training pipeline
        df_ordered = df[ALL_FEATURES]

        raw_predictions = self.pipeline.predict(df_ordered)
        
        # Houses cannot have negative prices; enforce lower bound
        predictions = [max(10000.0, float(round(p, 2))) for p in raw_predictions]
        return predictions

_predictor_instance = None

def get_predictor() -> HousePricePredictor:
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = HousePricePredictor()
    return _predictor_instance
