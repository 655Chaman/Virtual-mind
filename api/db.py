import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

# Database name
DB_NAME = "virtual_mind"

# Async Motor Client (for FastAPI async endpoints)
_async_client = None

# Synchronous PyMongo Client (for background tasks/sync scripts if needed)
_sync_client = None

def get_mongodb_uri():
    """Retrieve the MongoDB URI from environment variables."""
    from dotenv import load_dotenv
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    if not uri:
        raise ValueError("MONGODB_URI environment variable is not set. Please set it in your .env file.")
    return uri

def get_async_client() -> AsyncIOMotorClient:
    """Returns the async Motor client singleton."""
    global _async_client
    if _async_client is None:
        uri = get_mongodb_uri()
        _async_client = AsyncIOMotorClient(uri)
    return _async_client

def get_sync_client() -> MongoClient:
    """Returns the sync PyMongo client singleton."""
    global _sync_client
    if _sync_client is None:
        uri = get_mongodb_uri()
        _sync_client = MongoClient(uri)
    return _sync_client

# Helpers for common collections

def get_logs_collection():
    db = get_async_client()[DB_NAME]
    return db["logs"]

def get_projects_collection():
    db = get_async_client()[DB_NAME]
    return db["projects"]

def get_chat_history_collection():
    db = get_async_client()[DB_NAME]
    return db["chat_history"]

def get_prayer_times_collection():
    db = get_async_client()[DB_NAME]
    return db["prayer_times"]

# Synchronous helpers (for ingest/sync scripts if necessary)
def get_sync_logs_collection():
    db = get_sync_client()[DB_NAME]
    return db["logs"]

def get_sync_chat_history_collection():
    db = get_sync_client()[DB_NAME]
    return db["chat_history"]

def get_content_pipeline_collection():
    db = get_async_client()[DB_NAME]
    return db["content_pipeline"]

def get_sync_content_pipeline_collection():
    db = get_sync_client()[DB_NAME]
    return db["content_pipeline"]
