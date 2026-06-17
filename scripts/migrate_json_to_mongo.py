import os
import sys
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.db import get_sync_logs_collection

def migrate_json_to_mongo():
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    LOGS_DIR = PROJECT_ROOT / "data" / "logs"
    
    col = get_sync_logs_collection()
    
    if not LOGS_DIR.exists():
        print("No logs directory found.")
        return
        
    json_files = list(LOGS_DIR.glob("*.json"))
    print(f"Found {len(json_files)} JSON files. Migrating to MongoDB...")
    
    count = 0
    for file_path in json_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "date" in data:
                # Upsert into MongoDB based on date
                col.update_one(
                    {"date": data["date"]},
                    {"$set": data},
                    upsert=True
                )
                count += 1
        except Exception as e:
            print(f"Error migrating {file_path}: {e}")
            
    print(f"Successfully migrated {count} logs to MongoDB!")

if __name__ == "__main__":
    migrate_json_to_mongo()
