"""
Pydantic schemas for request validation and response models (MongoDB-compatible).
"""
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

# Supported categorical options derived from official Ames dataset
VALID_NEIGHBORHOODS = [
    "Blmngtn", "Blueste", "BrDale", "BrkSide", "ClearCr", "CollgCr", "Crawfor",
    "Edwards", "Gilbert", "IDOTRR", "MeadowV", "Mitchel", "NAmes", "NPkVill",
    "NWAmes", "NoRidge", "NridgHt", "OldTown", "SWISU", "Sawyer", "SawyerW",
    "Somerst", "StoneBr", "Timber", "Veenker"
]

VALID_BLDG_TYPES = ["1Fam", "2fmCon", "Duplex", "TwnhsE", "Twnhs"]

VALID_HOUSE_STYLES = [
    "1Story", "2Story", "1.5Fin", "1.5Unf", "SFoyer", "SLvl", "2.5Unf", "2.5Fin"
]

VALID_CENTRAL_AIR = ["Y", "N"]

class HouseFeaturesInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    OverallQual: int = Field(..., ge=1, le=10, description="Overall material and finish rating (1-10)")
    GrLivArea: float = Field(..., gt=100.0, le=10000.0, description="Above grade living area in square feet")
    TotalBsmtSF: float = Field(..., ge=0.0, le=10000.0, description="Total basement area in square feet")
    first_flr_sf: float = Field(..., alias="1stFlrSF", gt=100.0, le=10000.0, description="First floor square feet")
    FullBath: int = Field(..., ge=0, le=8, description="Full bathrooms above ground")
    HalfBath: int = Field(..., ge=0, le=6, description="Half baths above ground")
    BedroomAbvGr: int = Field(..., ge=0, le=10, description="Bedrooms above ground")
    TotRmsAbvGrd: int = Field(..., ge=1, le=20, description="Total rooms above ground (excluding baths)")
    Fireplaces: int = Field(..., ge=0, le=6, description="Number of fireplaces")
    GarageCars: int = Field(..., ge=0, le=6, description="Size of garage in car capacity")
    GarageArea: float = Field(..., ge=0.0, le=3000.0, description="Size of garage in square feet")
    YearBuilt: int = Field(..., ge=1800, le=2030, description="Original construction year")
    YearRemodAdd: int = Field(..., ge=1800, le=2030, description="Remodel date year")
    LotArea: float = Field(..., gt=500.0, le=300000.0, description="Lot size in square feet")
    Neighborhood: str = Field(..., description="Physical location within Ames city limits")
    BldgType: str = Field(..., description="Type of dwelling (e.g. 1Fam, TwnhsE)")
    HouseStyle: str = Field(..., description="Style of dwelling (e.g. 1Story, 2Story)")
    CentralAir: str = Field(..., description="Central air conditioning (Y or N)")

    @field_validator("Neighborhood")
    @classmethod
    def validate_neighborhood(cls, v: str) -> str:
        if v not in VALID_NEIGHBORHOODS:
            raise ValueError(f"Invalid neighborhood '{v}'. Must be one of: {', '.join(VALID_NEIGHBORHOODS)}")
        return v

    @field_validator("BldgType")
    @classmethod
    def validate_bldg_type(cls, v: str) -> str:
        if v not in VALID_BLDG_TYPES:
            raise ValueError(f"Invalid building type '{v}'. Must be one of: {', '.join(VALID_BLDG_TYPES)}")
        return v

    @field_validator("HouseStyle")
    @classmethod
    def validate_house_style(cls, v: str) -> str:
        if v not in VALID_HOUSE_STYLES:
            raise ValueError(f"Invalid house style '{v}'. Must be one of: {', '.join(VALID_HOUSE_STYLES)}")
        return v

    @field_validator("CentralAir")
    @classmethod
    def validate_central_air(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_CENTRAL_AIR:
            raise ValueError(f"Invalid central air value '{v}'. Must be 'Y' or 'N'.")
        return v_upper

    @field_validator("YearRemodAdd")
    @classmethod
    def validate_remodel_year(cls, v: int, info) -> int:
        built = info.data.get("YearBuilt")
        if built is not None and v < built:
            raise ValueError(f"Remodel year ({v}) cannot precede construction year ({built}).")
        return v

    def to_model_features(self) -> Dict[str, Any]:
        """Convert to exact DataFrame schema expected by ML pipeline"""
        return {
            "OverallQual": self.OverallQual,
            "GrLivArea": self.GrLivArea,
            "TotalBsmtSF": self.TotalBsmtSF,
            "1stFlrSF": self.first_flr_sf,
            "FullBath": self.FullBath,
            "HalfBath": self.HalfBath,
            "BedroomAbvGr": self.BedroomAbvGr,
            "TotRmsAbvGrd": self.TotRmsAbvGrd,
            "Fireplaces": self.Fireplaces,
            "GarageCars": self.GarageCars,
            "GarageArea": self.GarageArea,
            "YearBuilt": self.YearBuilt,
            "YearRemodAdd": self.YearRemodAdd,
            "LotArea": self.LotArea,
            "Neighborhood": self.Neighborhood,
            "BldgType": self.BldgType,
            "HouseStyle": self.HouseStyle,
            "CentralAir": self.CentralAir,
        }

class PredictionResponse(BaseModel):
    id: str
    predicted_price: float
    model_version: str
    created_at: str
    input_features: Dict[str, Any]

class PredictionHistoryRecord(BaseModel):
    id: str
    predicted_price: float
    model_version: str
    created_at: str
    overall_qual: int
    gr_liv_area: float
    total_bsmt_sf: float
    bedroom_abv_gr: int
    full_bath: int
    garage_cars: int
    year_built: int
    neighborhood: str
    bldg_type: str
    house_style: str
    input_features: Optional[Dict[str, Any]] = None

class PaginatedPredictions(BaseModel):
    items: List[PredictionHistoryRecord]
    total: int
    page: int
    page_size: int
    total_pages: int

class DashboardStats(BaseModel):
    total_predictions: int
    avg_price: float
    min_price: float
    max_price: float
    latest_prediction: Optional[str] = None
    common_neighborhood: Optional[str] = None

class ChartData(BaseModel):
    price_distribution: List[Dict[str, Any]]
    quality_vs_price: List[Dict[str, Any]]
    neighborhood_distribution: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]

class HealthStatus(BaseModel):
    status: str
    model_ready: bool
    model_version: str
    timestamp: str

class ModelMetricsResponse(BaseModel):
    model_name: str
    version: str
    trained_at: str
    evaluation_metric: str
    validation_metrics: Dict[str, float]
    candidate_comparisons: Dict[str, Dict[str, float]]
    features: Dict[str, List[str]]
    dataset_info: Dict[str, Any]
