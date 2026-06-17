import os
import sys
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.db import get_sync_chat_history_collection

def migrate_chat_to_mongo():
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    CHAT_FILE = PROJECT_ROOT / "data" / "logs" / "chat_history.jsonl"
    
    col = get_sync_chat_history_collection()
    
    if not CHAT_FILE.exists():
        print("No chat_history.jsonl file found.")
        return
        
    print(f"Found chat_history.jsonl. Migrating to MongoDB...")
    
    count = 0
    with open(CHAT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
                # upsert based on timestamp
                if "timestamp" in data:
                    col.update_one(
                        {"timestamp": data["timestamp"]},
                        {"$set": data},
                        upsert=True
                    )
                    count += 1
            except Exception as e:
                print(f"Error parsing line: {e}")
                
    print(f"Successfully migrated {count} chat exchanges to MongoDB!")

if __name__ == "__main__":
    migrate_chat_to_mongo()
