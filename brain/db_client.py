import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

_client = None
_db = None

def get_client():
    global _client
    if _client is None:
        if not MONGODB_URI:
            raise ValueError("MONGODB_URI is not set in environment variables.")
        _client = MongoClient(MONGODB_URI)
    return _client

def get_db():
    global _db
    if _db is None:
        client = get_client()
        _db = client["virtual_mind"]
    return _db

# Utility functions to get specific collections easily
def get_collection(name: str):
    return get_db()[name]
