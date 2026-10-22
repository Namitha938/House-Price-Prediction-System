"""
Data preprocessing pipeline and schema definitions for the House Price Prediction model.
"""
from typing import List, Tuple
from pathlib import Path
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Documented feature definitions
NUMERICAL_FEATURES: List[str] = [
    "OverallQual",
    "GrLivArea",
    "TotalBsmtSF",
    "1stFlrSF",
    "FullBath",
    "HalfBath",
    "BedroomAbvGr",
    "TotRmsAbvGrd",
    "Fireplaces",
    "GarageCars",
    "GarageArea",
    "YearBuilt",
    "YearRemodAdd",
    "LotArea",
]

CATEGORICAL_FEATURES: List[str] = [
    "Neighborhood",
    "BldgType",
    "HouseStyle",
    "CentralAir",
]

ALL_FEATURES: List[str] = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN: str = "SalePrice"

def get_preprocessor() -> ColumnTransformer:
    """
    Build a reusable ColumnTransformer for numerical and categorical features.
    Prevents data leakage: fit should only be called on training data.
    """
    numerical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_pipeline, NUMERICAL_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ]
    )
    return preprocessor

def load_and_validate_raw_data(data_path: Path) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Loads raw CSV, validates columns and target, and separates features from target.
    """
    if not data_path.exists():
        raise FileNotFoundError(f"Training data not found at {data_path}")

    df = pd.read_csv(data_path)

    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' is missing from raw dataset.")

    missing_cols = [col for col in ALL_FEATURES if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Required features missing from raw dataset: {missing_cols}")

    # Extract features and target
    X = df[ALL_FEATURES].copy()
    y = df[TARGET_COLUMN].copy()

    return X, y
