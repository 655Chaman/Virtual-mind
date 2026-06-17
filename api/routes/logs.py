from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import json
from pathlib import Path

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
LOGS_DIR = PROJECT_ROOT / "data" / "logs"

class NonNegotiables(BaseModel):
    # ── Classic Non-Negotiables ──
    salah_5: bool = False
    quran_30min: bool = False
    deep_work_4hr: bool = False
    physical_training: bool = False
    reading_1hr: bool = False
    adhkar: bool = False
    no_phone_before_8: bool = False
    no_sugar: bool = False
    # ── A.O.S. 2.0 Protocol Habits ──
    ice_bath: bool = False              # F.M.S. — Pain Conditioning
    cold_shower: bool = False           # Neuroplasticity Engine
    microbursts: bool = False           # F.M.S. — Combat Microbursts
    memorization_session: bool = False  # M.S.L. — Quran + Fight Combos
    app_lock_on: bool = False           # D.A.M. — Dopamine Annihilation
    sleep_on_floor: bool = False        # D.A.M. — Concrete Sleep Perk
    combat_training: bool = False       # O.C.I. — Omega Combat Intelligence
    fajr_without_alarm: bool = False    # Neuroplasticity Engine Peak
    smt_completed: bool = False         # S.M.T. — Sunday Master Task
    ramadan_mode_active: bool = False   # D.D.F. — 2x XP Multiplier

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
    # ── A.O.S. 2.0 Extensions ──
    smt_task: Optional[str] = None               # One critical Sunday task description
    combat_strategy_notes: Optional[str] = None  # O.C.I. / S.W.P. journal
    no_sales_today: bool = False                 # B.D.P. penalty trigger
    no_clients_today: bool = False               # B.D.P. food restriction trigger
    protocol_status: Optional[Dict[str, Any]] = None  # A.O.S. snapshot at log time
    folder_entries: List[FolderEntry] = []       # Camera / Text notes captured per folder
    prayers_logged: Optional[Dict[str, bool]] = None # Prevent stripping of logged prayers


@router.post("/log")
def create_log(log: DailyLog):
    from brain.aos_protocols import get_all_protocol_statuses

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = LOGS_DIR / f"{log.date}.json"

    # Build the log dict first
    log_dict = log.model_dump()

    # Load existing data to merge and preserve fields not sent/updated
    existing_data = {}
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        except Exception:
            pass

    # Preserve prayers_logged if not supplied in incoming log_dict
    if log_dict.get("prayers_logged") is None and "prayers_logged" in existing_data:
        log_dict["prayers_logged"] = existing_data["prayers_logged"]

    # Preserve folder_entries if incoming is empty/missing but existing has entries
    if not log_dict.get("folder_entries") and existing_data.get("folder_entries"):
        log_dict["folder_entries"] = existing_data["folder_entries"]

    is_ramadan = log.non_negotiables.ramadan_mode_active

    # Snapshot protocol status at time of logging
    protocol_snapshot = get_all_protocol_statuses(
        target_date=log.date, is_ramadan=is_ramadan
    )
    log_dict["protocol_status"] = protocol_snapshot.get("summary", {})

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(log_dict, f, indent=2)

    return {
        "success": True,
        "date": log.date,
        "aos_health": log_dict["protocol_status"].get("aos_health_score", 0),
    }

from api.services.sheet_parser import SheetParser

@router.post("/ingest-sheet")
def ingest_sheet(data: Dict[str, Any]):
    """
    Ingests raw sheet text, parses it, and saves as a DailyLog.
    """
    text = data.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
        
    parsed = SheetParser.parse_sheet(text)
    
    # Create or update log
    today_str = date.today().isoformat()
    file_path = LOGS_DIR / f"{today_str}.json"
    
    # If exists, we might want to merge, but for now overwrite/init
    log_entry = {
        "date": today_str,
        "timestamp": datetime.now().isoformat(),
        "text": text[:200] + "..." if len(text) > 200 else text, # Short summary
        "pillars": parsed["pillars"],
        "non_negotiables": NonNegotiables().model_dump(),
        "folder_entries": [],
        "prayers_logged": None,
        "work_done": parsed["work_done"],
        "lessons_learned": parsed["lessons_learned"]
    }
    
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(log_entry, f, indent=2)
        
    return {"success": True, "data": log_entry}

@router.post("/entry")
def add_folder_entry(entry: FolderEntry):
    """
    Appends a new FolderEntry to today's log file. If today's log doesn't exist, it creates a basic one.
    """
    today_str = date.today().isoformat()
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = LOGS_DIR / f"{today_str}.json"
    
    log_data = {}
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        except Exception:
            pass
            
    if not log_data:
        log_data = {
            "date": today_str,
            "timestamp": datetime.now().isoformat(),
            "text": "Auto-created log for folder entry.",
            "pillars": [],
            "non_negotiables": NonNegotiables().model_dump(),

            "folder_entries": []
        }
        
    if "folder_entries" not in log_data:
        log_data["folder_entries"] = []
        
    # Append the new entry
    log_data["folder_entries"].append(entry.model_dump())
    
    # Save back
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(log_data, f, indent=2)
        
    return {"success": True, "entry": entry.model_dump()}

@router.get("/logs")
def get_logs(pillar: Optional[str] = None, last: Optional[int] = None):
    logs = []
    if LOGS_DIR.exists():
        for file_path in LOGS_DIR.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    logs.append(data)
            except Exception:
                continue
                
    # Sort by date descending
    logs.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    if pillar:
        logs = [log for log in logs if pillar in log.get("pillars", [])]
        
    if last is not None and last > 0:
        logs = logs[:last]
        
    return logs

@router.get("/log/{target_date}")
def get_log(target_date: str):
    file_path = LOGS_DIR / f"{target_date}.json"
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"logged": False, "date": target_date}
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
    logs = []
    if LOGS_DIR.exists():
        for file_path in LOGS_DIR.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    logs.append(json.load(f))
            except Exception:
                continue
                
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
    
    logs = []
    if LOGS_DIR.exists():
        for file_path in LOGS_DIR.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    log_date = date.fromisoformat(data.get("date", "1970-01-01"))
                    if log_date > last_30:
                        logs.append((log_date, data.get("non_negotiables", {})))
            except Exception:
                continue
                
    keys = [
        "salah_5", "quran_30min", "deep_work_4hr", "physical_training",
        "reading_1hr", "adhkar", "no_phone_before_8", "no_sugar"
    ]
    
    summary = {k: {"last_7": 0, "last_30": 0, "percentage_7": 0} for k in keys}
    
    for log_date, nns in logs:
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
