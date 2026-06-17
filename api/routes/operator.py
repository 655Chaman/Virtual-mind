from fastapi import APIRouter
import os
import json
import datetime
from brain.analyzers.operator_logger import (
    generate_operator_entry,
    append_to_operator_log,
    get_operator_log_summary
)

router = APIRouter()

@router.get("/api/operator/log")
def get_operator_log():
    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "operator_log.md")
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return {"log": f.read()}
    return {"log": ""}

@router.post("/api/operator/generate")
def generate_entry():
    from api.db import get_sync_logs_collection
    recent_logs = []
    
    try:
        col = get_sync_logs_collection()
        fourteen_days_ago = datetime.date.today() - datetime.timedelta(days=14)
        start_date_str = fourteen_days_ago.isoformat()
        
        cursor = col.find({"date": {"$gte": start_date_str}})
        recent_logs = list(cursor)
    except Exception as e:
        print(f"Error fetching logs from MongoDB: {e}")
                
    entry = generate_operator_entry(recent_logs)
    append_to_operator_log(entry)
    
    return {"status": "success", "message": "Operator log entry generated and appended."}

@router.get("/api/operator/patterns")
def get_patterns():
    return get_operator_log_summary()
