"""
Pytest configuration, fixtures, and test database setup.
"""
import pytest
from fastapi.testclient import TestClient
from pymongo import MongoClient

from app.config import settings
from app.main import app
from app.database import get_database, get_predictions_collection

TEST_DB_NAME = "house_price_test_db"

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    original_db = settings.MONGODB_DB_NAME
    settings.MONGODB_DB_NAME = TEST_DB_NAME
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
    # Clear test database before running tests
    client.drop_database(TEST_DB_NAME)
    
    yield
    
    # Cleanup after tests
    client.drop_database(TEST_DB_NAME)
    settings.MONGODB_DB_NAME = original_db
    client.close()

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def clean_predictions():
    coll = get_predictions_collection()
    coll.delete_many({})
    yield coll
    coll.delete_many({})

@pytest.fixture
def valid_house_payload():
    return {
        "OverallQual": 7,
        "GrLivArea": 1710.0,
        "TotalBsmtSF": 856.0,
        "1stFlrSF": 856.0,
        "FullBath": 2,
        "HalfBath": 1,
        "BedroomAbvGr": 3,
        "TotRmsAbvGrd": 8,
        "Fireplaces": 1,
        "GarageCars": 2,
        "GarageArea": 548.0,
        "YearBuilt": 2003,
        "YearRemodAdd": 2003,
        "LotArea": 8450.0,
        "Neighborhood": "CollgCr",
        "BldgType": "1Fam",
        "HouseStyle": "2Story",
        "CentralAir": "Y"
    }

