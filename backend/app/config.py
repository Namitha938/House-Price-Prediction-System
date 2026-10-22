"""
Application configuration using pydantic-settings.
Supports MongoDB connection and environment variable overrides.
"""
from pathlib import Path
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "House Price Prediction API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # MongoDB Database Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "house_price_db"
    
    # Model Artifacts
    MODEL_PATH: str = str(BASE_DIR / "models" / "house_price_pipeline.joblib")
    METADATA_PATH: str = str(BASE_DIR / "models" / "model_metadata.json")
    
    # SMTP Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "ProphetVal AI"
    SMTP_USE_TLS: bool = True
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    model_config = ConfigDict(env_file=".env", extra="allow")

settings = Settings()
