from fastapi import APIRouter, Query
from typing import List, Dict, Any
from datetime import datetime, date, timedelta
import json
from pathlib import Path

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
LOGS_DIR = PROJECT_ROOT / "data" / "logs"

def get_pillar_completion(nns: Dict[str, Any], log_date_str: str) -> Dict[str, float]:
    """Calculates completion percentage (0-100) for each of the 4 life pillars."""
    # 1. DEEN: 5 habits
    deen_keys = ["salah_5", "quran_30min", "adhkar", "memorization_session", "fajr_without_alarm"]
    deen_count = sum(1 for k in deen_keys if nns.get(k, False))
    deen_score = (deen_count / len(deen_keys)) * 100

    # 2. ELESIUM: 1 habit weekdays, 2 habits on Sunday (deep work + Sunday Master Task)
    try:
        dt = date.fromisoformat(log_date_str)
        is_sunday = (dt.weekday() == 6)
    except ValueError:
        is_sunday = False
        
    if is_sunday:
        elesium_keys = ["deep_work_4hr", "smt_completed"]
        elesium_count = sum(1 for k in elesium_keys if nns.get(k, False))
        elesium_score = (elesium_count / len(elesium_keys)) * 100
    else:
        elesium_score = 100.0 if nns.get("deep_work_4hr", False) else 0.0

    # 3. INFLUENCE: 1 habit (Reading)
    influence_score = 100.0 if nns.get("reading_1hr", False) else 0.0

    # 4. SELF: 9 habits
    self_keys = [
        "physical_training", "no_phone_before_8", "no_sugar", 
        "ice_bath", "cold_shower", "microbursts", 
        "combat_training", "app_lock_on", "sleep_on_floor"
    ]
    self_count = sum(1 for k in self_keys if nns.get(k, False))
    self_score = (self_count / len(self_keys)) * 100

    return {
        "DEEN": round(deen_score, 1),
        "ELESIUM": round(elesium_score, 1),
        "INFLUENCE": round(influence_score, 1),
        "SELF": round(self_score, 1)
    }

@router.get("/pillars")
def get_pillar_history(days: int = Query(30, ge=1, le=90)):
    """Returns compliance score history for each pillar over the last N days."""
    history = []
    today = date.today()
    
    # Pre-populate dictionary of dates to easily map logs
    dates_list = [(today - timedelta(days=i)).isoformat() for i in range(days)]
    dates_list.reverse() # Chronological order
    
    logs_by_date = {}
    if LOGS_DIR.exists():
        for file_path in LOGS_DIR.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    log_data = json.load(f)
                    log_date = log_data.get("date")
                    if log_date:
                        logs_by_date[log_date] = log_data.get("non_negotiables", {})
            except Exception as e:
                import traceback
                traceback.print_exc()
                continue
                
    for d_str in dates_list:
        nns = logs_by_date.get(d_str, {})
        scores = get_pillar_completion(nns, d_str)
        history.append({
            "date": d_str,
            **scores
        })
        
    return history
