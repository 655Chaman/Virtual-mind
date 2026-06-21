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
    logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "logs")
    recent_logs = []
    
    if os.path.exists(logs_dir):
        fourteen_days_ago = datetime.date.today() - datetime.timedelta(days=14)
        for filename in os.listdir(logs_dir):
            if not filename.endswith(".json"): continue
            
            try:
                date_str = filename.replace(".json", "")
                log_date = datetime.date.fromisoformat(date_str)
                if log_date >= fourteen_days_ago:
                    with open(os.path.join(logs_dir, filename), "r") as f:
                        recent_logs.append(json.load(f))
            except Exception as e:
                import traceback
                traceback.print_exc()
                pass
                
    entry = generate_operator_entry(recent_logs)
    append_to_operator_log(entry)
    
    return {"status": "success", "message": "Operator log entry generated and appended."}

@router.get("/api/operator/patterns")
def get_patterns():
    return get_operator_log_summary()
