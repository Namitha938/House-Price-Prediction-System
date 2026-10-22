"""
MongoDB database connection, indexing, and lifecycle management.
"""
import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.collection import Collection
from app.config import settings

logger = logging.getLogger(__name__)

_client: MongoClient = None

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}")
        _client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client

def get_database() -> Database:
    client = get_mongo_client()
    return client[settings.MONGODB_DB_NAME]

def get_predictions_collection() -> Collection:
    db = get_database()
    return db["predictions"]

def get_password_resets_collection() -> Collection:
    db = get_database()
    return db["password_resets"]

def init_db():
    """
    Initialize indexes on MongoDB collections.
    """
    try:
        collection = get_predictions_collection()
        collection.create_index([("created_at", DESCENDING)])
        collection.create_index([("overall_qual", ASCENDING)])
        collection.create_index([("neighborhood", ASCENDING)])
        logger.info("MongoDB indexes verified on 'predictions' collection.")
        
        resets = get_password_resets_collection()
        resets.create_index([("created_at", ASCENDING)], expireAfterSeconds=900)
        resets.create_index([("email", ASCENDING)])
        logger.info("MongoDB indexes verified on 'password_resets' collection.")
    except Exception as e:
        logger.warning(f"Could not initialize MongoDB indexes: {e}")

def close_mongo_connection():
    global _client
    if _client is not None:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed.")
