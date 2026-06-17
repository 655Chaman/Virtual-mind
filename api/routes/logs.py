from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from api.database import get_db
import json
from pathlib import Path

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

class NonNegotiables(BaseModel):
    salah_5: bool = False
    quran_30min: bool = False
    deep_work_4hr: bool = False
    physical_training: bool = False
    reading_1hr: bool = False
    adhkar: bool = False
    no_phone_before_8: bool = False
    no_sugar: bool = False
    ice_bath: bool = False
    cold_shower: bool = False
    microbursts: bool = False
    memorization_session: bool = False
    app_lock_on: bool = False
    sleep_on_floor: bool = False
    combat_training: bool = False
    fajr_without_alarm: bool = False
    smt_completed: bool = False
    ramadan_mode_active: bool = False

class FolderEntry(BaseModel):
    id: str = Field(default_factory=lambda: datetime.now().strftime("%Y%m%d%H%M%S"))
    timestamp: str
    pillar: str
    text: str
    image_url: Optional[str] = None

class DailyLog(BaseModel):
    date: str
    timestamp: str
    text: str
    pillars: List[str]
    non_negotiables: NonNegotiables
    flaw_triggers: List[int] = []
    score: Optional[int] = None
    work_done: Optional[str] = None
    lessons_learned: Optional[str] = None
    xp_earned: Optional[int] = None
    active_penalties: List[str] = []
    perks_unlocked: List[str] = []
    smt_task: Optional[str] = None
    combat_strategy_notes: Optional[str] = None
    no_sales_today: bool = False
    no_clients_today: bool = False
    protocol_status: Optional[Dict[str, Any]] = None
    folder_entries: List[FolderEntry] = []
    prayers_logged: Optional[Dict[str, bool]] = None

@router.post("/log")
def create_log(log: DailyLog):
    from brain.xp_engine import compute_xp_from_log, get_active_penalties
    from brain.aos_protocols import get_all_protocol_statuses

    db = get_db()
    log_dict = log.model_dump()

    existing_data = db.daily_logs.find_one({"date": log.date}) or {}

    if log_dict.get("prayers_logged") is None and "prayers_logged" in existing_data:
        log_dict["prayers_logged"] = existing_data["prayers_logged"]

    if not log_dict.get("folder_entries") and existing_data.get("folder_entries"):
        log_dict["folder_entries"] = existing_data["folder_entries"]

    is_ramadan = log.non_negotiables.ramadan_mode_active

    xp_result = compute_xp_from_log(log_dict, is_ramadan=is_ramadan)
    log_dict["xp_earned"] = xp_result["total_xp"]
    log_dict["active_penalties"] = xp_result["penalties_active"]
    log_dict["perks_unlocked"] = [p["name"] for p in xp_result["perks_unlocked"]]

    protocol_snapshot = get_all_protocol_statuses(target_date=log.date, is_ramadan=is_ramadan)
    log_dict["protocol_status"] = protocol_snapshot.get("summary", {})

    db.daily_logs.update_one({"date": log.date}, {"$set": log_dict}, upsert=True)

    return {
        "success": True,
        "date": log.date,
        "xp_earned": log_dict["xp_earned"],
        "active_penalties": log_dict["active_penalties"],
        "perks_unlocked": log_dict["perks_unlocked"],
        "aos_health": log_dict["protocol_status"].get("aos_health_score", 0),
    }

from api.services.sheet_parser import SheetParser

@router.post("/ingest-sheet")
def ingest_sheet(data: Dict[str, Any]):
    text = data.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
        
    parsed = SheetParser.parse_sheet(text)
    today_str = date.today().isoformat()
    
    log_entry = {
        "date": today_str,
        "timestamp": datetime.now().isoformat(),
        "text": text[:200] + "..." if len(text) > 200 else text,
        "pillars": parsed["pillars"],
        "non_negotiables": NonNegotiables().model_dump(),
        "folder_entries": [],
        "prayers_logged": None,
        "work_done": parsed["work_done"],
        "lessons_learned": parsed["lessons_learned"]
    }
    
    db = get_db()
    db.daily_logs.update_one({"date": today_str}, {"$set": log_entry}, upsert=True)
        
    return {"success": True, "data": log_entry}

@router.post("/entry")
def add_folder_entry(entry: FolderEntry):
    today_str = date.today().isoformat()
    db = get_db()
    
    existing = db.daily_logs.find_one({"date": today_str})
    if not existing:
        log_data = {
            "date": today_str,
            "timestamp": datetime.now().isoformat(),
            "text": "Auto-created log for folder entry.",
            "pillars": [],
            "non_negotiables": NonNegotiables().model_dump(),
            "folder_entries": [entry.model_dump()]
        }
        db.daily_logs.insert_one(log_data)
    else:
        db.daily_logs.update_one(
            {"date": today_str},
            {"$push": {"folder_entries": entry.model_dump()}}
        )
        
    return {"success": True, "entry": entry.model_dump()}

@router.get("/logs")
def get_logs(pillar: Optional[str] = None, last: Optional[int] = None):
    db = get_db()
    query = {}
    if pillar:
        query["pillars"] = pillar
        
    cursor = db.daily_logs.find(query, {"_id": 0}).sort("date", -1)
    if last is not None and last > 0:
        cursor = cursor.limit(last)
        
    return list(cursor)

@router.get("/log/{target_date}")
def get_log(target_date: str):
    db = get_db()
    doc = db.daily_logs.find_one({"date": target_date}, {"_id": 0})
    if doc:
        return doc
    return {"logged": False, "date": target_date}

def calc_streak(dates_set):
    if not dates_set: 
        return 0
    today = date.today()
    current_date = today
    
    if current_date.isoformat() not in dates_set:
        current_date -= timedelta(days=1)
        if current_date.isoformat() not in dates_set:
            return 0
            
    streak = 0
    while current_date.isoformat() in dates_set:
        streak += 1
        current_date -= timedelta(days=1)
    return streak

def calc_longest_streak(dates_set):
    if not dates_set:
        return 0
    try:
        sorted_dates = sorted([date.fromisoformat(d) for d in dates_set])
    except ValueError:
        return 0
    
    if not sorted_dates: 
        return 0
        
    longest = 1
    current = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
            current += 1
            longest = max(longest, current)
        elif (sorted_dates[i] - sorted_dates[i-1]).days > 1:
            current = 1
    return longest

@router.get("/streak")
def get_streak():
    db = get_db()
    logs = list(db.daily_logs.find({}, {"date": 1, "non_negotiables": 1, "_id": 0}))
    
    logged_dates = {log.get("date") for log in logs if log.get("date")}
    
    pillar_dates = {
        "DEEN": set(),
        "ELESIUM": set(),
        "INFLUENCE": set(),
        "SELF": set()
    }
    
    for log in logs:
        d = log.get("date")
        if not d: continue
        
        nns = log.get("non_negotiables", {})
        if nns.get("salah_5") or nns.get("quran_30min") or nns.get("adhkar"):
             pillar_dates["DEEN"].add(d)
        if nns.get("deep_work_4hr"):
             pillar_dates["ELESIUM"].add(d)
        if nns.get("reading_1hr"):
             pillar_dates["INFLUENCE"].add(d)
        if nns.get("physical_training") or nns.get("no_phone_before_8") or nns.get("no_sugar"):
             pillar_dates["SELF"].add(d)
                
    today = date.today()
    phase_0_start = date(2026, 2, 22)
    checkpoint_date = date(2026, 5, 22)
    
    return {
        "overall_streak": calc_streak(logged_dates),
        "pillar_streaks": {
            k: calc_streak(v) for k, v in pillar_dates.items()
        },
        "longest_streak_ever": calc_longest_streak(logged_dates),
        "total_logged_days": len(logged_dates),
        "phase_0_day": max(0, (today - phase_0_start).days),
        "days_to_checkpoint": max(0, (checkpoint_date - today).days)
    }

@router.get("/non-negotiables/summary")
def get_nn_summary():
    today = date.today()
    last_7 = today - timedelta(days=7)
    last_30 = today - timedelta(days=30)
    
    db = get_db()
    # Simple query for all dates and filter in Python
    logs = list(db.daily_logs.find({}, {"date": 1, "non_negotiables": 1, "_id": 0}))
    
    valid_logs = []
    for data in logs:
        try:
            log_date = date.fromisoformat(data.get("date", "1970-01-01"))
            if log_date > last_30:
                valid_logs.append((log_date, data.get("non_negotiables", {})))
        except Exception:
            continue
                
    keys = [
        "salah_5", "quran_30min", "deep_work_4hr", "physical_training",
        "reading_1hr", "adhkar", "no_phone_before_8", "no_sugar"
    ]
    
    summary = {k: {"last_7": 0, "last_30": 0, "percentage_7": 0} for k in keys}
    
    for log_date, nns in valid_logs:
        if not isinstance(nns, dict):
            continue
        is_last_7 = log_date > last_7
        for k in keys:
            if nns.get(k, False):
                summary[k]["last_30"] += 1
                if is_last_7:
                    summary[k]["last_7"] += 1
                    
    for k in keys:
        summary[k]["percentage_7"] = round((summary[k]["last_7"] / 7) * 100)
        
    return summary

@router.get("/self/materials")
def get_study_materials():
    filepath = PROJECT_ROOT / "inputs" / "minds_to_study.md"
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    return {"content": "No study materials found."}
