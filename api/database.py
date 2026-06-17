import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("WARNING: MONGODB_URI is not set in environment variables.")

client = None
db = None

def connect_to_mongo():
    global client, db
    if MONGODB_URI:
        client = MongoClient(MONGODB_URI)
        db = client["virtual_mind"]
        print("[DATABASE] Connected to MongoDB Atlas (Synchronous)")
    else:
        print("[DATABASE] No MONGODB_URI provided. Database operations will fail.")

def close_mongo_connection():
    global client
    if client:
        client.close()
        print("[DATABASE] Closed MongoDB connection")

def get_db():
    global db
    if db is None:
        connect_to_mongo()
    if db is None:
        raise RuntimeError("Database not initialized. Check MONGODB_URI.")
    return db
