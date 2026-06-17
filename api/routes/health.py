from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta
from api.database import get_db
from pathlib import Path

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# ─────────────────────────────────────────────────────────────────────────────
# SLEEP ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class StopInput(BaseModel):
    client_timestamp: Optional[str] = None

@router.post("/sleep/start")
def start_sleep():
    """Logs the exact timestamp when the user goes to bed."""
    current_time = datetime.utcnow().isoformat()
    db = get_db()
    
    # Ghost Session Annihilation
    db.sleep_logs.update_many(
        {"end_time": {"$exists": False}}, 
        {"$set": {"end_time": current_time, "duration_minutes": 0, "ghost_closed": True}}
    )
    
    result = db.sleep_logs.insert_one({"start_time": current_time})
    return {"status": "success", "start_time": current_time, "sleep_id": str(result.inserted_id)}

@router.post("/sleep/stop")
def stop_sleep(data: StopInput = StopInput()):
    """Logs the wake-up time and calculates duration."""
    now = datetime.utcnow()
    now_iso = data.client_timestamp or now.isoformat()
    db = get_db()
    
    # Sort by start_time descending, find one without end_time
    session = db.sleep_logs.find_one({"end_time": {"$exists": False}}, sort=[("start_time", -1)])
    if not session:
        return {"status": "error", "message": "No active sleep session."}
        
    start = datetime.fromisoformat(session["start_time"])
    end_dt = datetime.fromisoformat(now_iso.replace('Z', '+00:00')) if data.client_timestamp else now
    duration = max(0, (end_dt.replace(tzinfo=None) - start.replace(tzinfo=None)).total_seconds() / 60.0)
    
    db.sleep_logs.update_one(
        {"_id": session["_id"]},
        {"$set": {"end_time": now_iso, "duration_minutes": duration}}
    )
    
    return {
        "status": "success",
        "sleep_id": str(session["_id"]),
        "duration_minutes": duration,
        "duration_hours": round(duration / 60.0, 2)
    }

@router.get("/sleep/today")
def get_sleep_status():
    """Returns current sleep state and last completed session."""
    db = get_db()
    active = db.sleep_logs.find_one({"end_time": {"$exists": False}}, sort=[("start_time", -1)])
    last = db.sleep_logs.find_one({"end_time": {"$exists": True}}, sort=[("start_time", -1)])
    
    return {
        "is_sleeping": bool(active),
        "sleep_start_time": active["start_time"] if active else None,
        "last_sleep_hours": round(last["duration_minutes"] / 60.0, 2) if last else None,
        "last_sleep_start": last["start_time"] if last else None,
        "last_sleep_end": last["end_time"] if last else None,
    }

@router.get("/sleep/history")
def get_sleep_history(days: int = 30):
    """Returns sleep sessions for the last N days."""
    db = get_db()
    cursor = db.sleep_logs.find({"end_time": {"$exists": True}}).sort("start_time", -1).limit(days)
    rows = list(cursor)
    return [
        {
            "start_time": r["start_time"],
            "end_time": r["end_time"],
            "duration_hours": round(r.get("duration_minutes", 0) / 60.0, 2)
        }
        for r in rows
    ]

# ─────────────────────────────────────────────────────────────────────────────
# MORNING READINESS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class ReadinessInput(BaseModel):
    energy: int       # 1-5
    clarity: int      # 1-5
    mood: int         # 1-5
    sleep_id: Optional[str] = None

@router.post("/readiness")
def log_readiness(data: ReadinessInput):
    """Logs the morning readiness check-in (energy, clarity, mood)."""
    if not all(1 <= v <= 5 for v in [data.energy, data.clarity, data.mood]):
        return {"status": "error", "message": "All values must be between 1 and 5."}
    today = date.today().isoformat()
    score = data.energy + data.clarity + data.mood
    db = get_db()
    
    db.readiness_logs.update_one(
        {"date": today},
        {"$set": {
            "energy": data.energy,
            "clarity": data.clarity,
            "mood": data.mood,
            "score": score,
            "sleep_id": data.sleep_id
        }},
        upsert=True
    )
    return {"status": "success", "date": today, "score": score, "max": 15}

@router.get("/readiness/today")
def get_readiness_today():
    """Returns today's readiness score if logged."""
    today = date.today().isoformat()
    db = get_db()
    row = db.readiness_logs.find_one({"date": today})
    if not row:
        return {"logged": False}
    return {
        "logged": True,
        "date": row["date"],
        "energy": row["energy"],
        "clarity": row["clarity"],
        "mood": row["mood"],
        "score": row["score"],
        "max": 15,
        "label": _readiness_label(row["score"])
    }

@router.get("/readiness/history")
def get_readiness_history(days: int = 30):
    """Returns readiness scores for the last N days."""
    db = get_db()
    rows = list(db.readiness_logs.find().sort("date", -1).limit(days))
    return [
        {
            "date": r["date"],
            "score": r["score"],
            "energy": r["energy"],
            "clarity": r["clarity"],
            "mood": r["mood"],
            "label": _readiness_label(r["score"])
        }
        for r in rows
    ]

def _readiness_label(score: int) -> str:
    if score >= 13: return "PEAK STATE"
    if score >= 10: return "OPERATIONAL"
    if score >= 7:  return "SUBOPTIMAL"
    return "RECOVERY NEEDED"

# ─────────────────────────────────────────────────────────────────────────────
# FASTING ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/fast/start")
def start_fast():
    """Starts a fasting window."""
    now_iso = datetime.utcnow().isoformat()
    db = get_db()
    
    # Ghost Session Annihilation
    db.fast_logs.update_many(
        {"end_time": {"$exists": False}}, 
        {"$set": {"end_time": now_iso, "duration_minutes": 0, "ghost_closed": True}}
    )
    
    db.fast_logs.insert_one({"start_time": now_iso, "goal_minutes": 960})
    return {"status": "success", "start_time": now_iso}

@router.post("/fast/stop")
def stop_fast(data: StopInput = StopInput()):
    """Ends the current fasting window."""
    now = datetime.utcnow()
    now_iso = data.client_timestamp or now.isoformat()
    db = get_db()
    
    session = db.fast_logs.find_one({"end_time": {"$exists": False}}, sort=[("start_time", -1)])
    if not session:
        return {"status": "error", "message": "No active fast."}
        
    start = datetime.fromisoformat(session["start_time"])
    end_dt = datetime.fromisoformat(now_iso.replace('Z', '+00:00')) if data.client_timestamp else now
    duration = max(0, (end_dt.replace(tzinfo=None) - start.replace(tzinfo=None)).total_seconds() / 60.0)
    
    db.fast_logs.update_one(
        {"_id": session["_id"]},
        {"$set": {"end_time": now_iso, "duration_minutes": duration}}
    )
    return {
        "status": "success",
        "duration_minutes": duration,
        "duration_hours": round(duration / 60.0, 2)
    }

@router.get("/fast/today")
def get_fast_status():
    """Returns current fasting state and last completed fast."""
    db = get_db()
    active = db.fast_logs.find_one({"end_time": {"$exists": False}}, sort=[("start_time", -1)])
    last = db.fast_logs.find_one({"end_time": {"$exists": True}}, sort=[("start_time", -1)])
    
    now = datetime.utcnow()
    elapsed_minutes = None
    if active:
        start = datetime.fromisoformat(active["start_time"])
        elapsed_minutes = (now - start).total_seconds() / 60.0
        
    return {
        "is_fasting": bool(active),
        "fast_start_time": active["start_time"] if active else None,
        "elapsed_minutes": round(elapsed_minutes, 1) if elapsed_minutes else None,
        "elapsed_hours": round(elapsed_minutes / 60.0, 2) if elapsed_minutes else None,
        "fast_phase": _fast_phase(elapsed_minutes) if elapsed_minutes else None,
        "last_fast_hours": round(last.get("duration_minutes", 0) / 60.0, 2) if last else None,
    }

@router.get("/fast/history")
def get_fast_history(days: int = 30):
    """Returns fasting history for the last N days."""
    db = get_db()
    rows = list(db.fast_logs.find({"end_time": {"$exists": True}}).sort("start_time", -1).limit(days))
    return [
        {
            "start_time": r["start_time"],
            "end_time": r["end_time"],
            "duration_hours": round(r.get("duration_minutes", 0) / 60.0, 2),
            "goal_hit": r.get("duration_minutes", 0) >= 960  # 16 hours
        }
        for r in rows
    ]

def _fast_phase(minutes: float) -> str:
    hours = minutes / 60.0
    if hours < 12:  return "GLYCOGEN BURNING"
    if hours < 14:  return "FAT BURNING INITIATED"
    if hours < 16:  return "KETOSIS APPROACHING"
    if hours < 18:  return "AUTOPHAGY ACTIVE"
    return "DEEP AUTOPHAGY — CELLULAR REPAIR"

# ─────────────────────────────────────────────────────────────────────────────
# HYDRATION ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class HydrationInput(BaseModel):
    amount_ml: int = 250

@router.post("/hydration/add")
def add_hydration(data: HydrationInput):
    """Logs a hydration entry."""
    from fastapi import HTTPException
    if data.amount_ml > 3000:
        raise HTTPException(status_code=400, detail="Maximum 3000ml per entry to prevent database poisoning.")
        
    today = date.today().isoformat()
    now_iso = datetime.utcnow().isoformat()
    db = get_db()
    
    db.hydration_logs.insert_one({
        "date": today,
        "amount_ml": data.amount_ml,
        "logged_at": now_iso
    })
    
    # Recalculate total for today
    pipeline = [
        {"$match": {"date": today}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_ml"}}}
    ]
    result = list(db.hydration_logs.aggregate(pipeline))
    total = result[0]["total"] if result else 0
    
    return {"status": "success", "today_total_ml": total, "today_total_L": round(total / 1000, 2)}

@router.get("/hydration/today")
def get_hydration_today():
    """Returns today's total hydration intake."""
    today = date.today().isoformat()
    goal_ml = 4500 # Baseline consistent target

    db = get_db()
    # Check workout DB for rest day status to adjust range
    row = db.workouts.find_one({"date": today})
    if row:
        goal_ml = 4000 if row.get("is_rest_day", False) else 5000
        
    pipeline = [
        {"$match": {"date": today}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_ml"}}}
    ]
    result = list(db.hydration_logs.aggregate(pipeline))
    total = result[0]["total"] if result else 0
    
    return {
        "today_ml": total,
        "today_L": round(total / 1000, 2),
        "goal_ml": goal_ml,
        "goal_L": goal_ml / 1000,
        "percent": min(100, round((total / goal_ml) * 100)),
        "goal_hit": total >= goal_ml
    }

@router.get("/hydration/history")
def get_hydration_history(days: int = 30):
    """Returns daily hydration totals for last N days."""
    db = get_db()
    pipeline = [
        {"$group": {"_id": "$date", "total_ml": {"$sum": "$amount_ml"}}},
        {"$sort": {"_id": -1}},
        {"$limit": days}
    ]
    rows = list(db.hydration_logs.aggregate(pipeline))
    return [{"date": r["_id"], "total_ml": r["total_ml"], "total_L": round(r["total_ml"] / 1000, 2)} for r in rows]

# ─────────────────────────────────────────────────────────────────────────────
# DEEP WORK ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class DeepWorkStopInput(BaseModel):
    label: Optional[str] = ""

class DeepWorkStartInput(BaseModel):
    journal_entry: str

@router.post("/deepwork/start")
def start_deepwork(data: DeepWorkStartInput):
    """Starts a deep work session with a mandatory friction journal entry."""
    now_iso = datetime.utcnow().isoformat()
    db = get_db()
    active = db.deepwork_logs.find_one({"end_time": {"$exists": False}})
    if active:
        return {"status": "error", "message": "Session already active."}
        
    db.deepwork_logs.insert_one({
        "start_time": now_iso, 
        "journal_entry": data.journal_entry,
        "label": ""
    })
    return {"status": "success", "start_time": now_iso}

@router.post("/deepwork/stop")
def stop_deepwork(data: DeepWorkStopInput):
    """Ends the current deep work session."""
    now = datetime.utcnow()
    now_iso = now.isoformat()
    db = get_db()
    
    session = db.deepwork_logs.find_one({"end_time": {"$exists": False}}, sort=[("start_time", -1)])
    if not session:
        return {"status": "error", "message": "No active session."}
        
    start = datetime.fromisoformat(session["start_time"])
    duration = (now - start).total_seconds() / 60.0
    
    db.deepwork_logs.update_one(
        {"_id": session["_id"]},
        {"$set": {
            "end_time": now_iso, 
            "duration_minutes": duration, 
            "label": data.label or ""
        }}
    )
    return {
        "status": "success",
        "duration_minutes": duration,
        "duration_hours": round(duration / 60.0, 2)
    }

@router.get("/deepwork/today")
def get_deepwork_today():
    """Returns today's deep work state and totals."""
    today = date.today().isoformat()
    now = datetime.utcnow()
    db = get_db()
    
    active = db.deepwork_logs.find_one({"end_time": {"$exists": False}}, sort=[("start_time", -1)])
    
    # Query for completed sessions today
    # We use regex to match the date part of start_time
    pipeline = [
        {"$match": {"end_time": {"$exists": True}, "start_time": {"$regex": f"^{today}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$duration_minutes"}, "sessions": {"$sum": 1}}}
    ]
    result = list(db.deepwork_logs.aggregate(pipeline))
    completed = result[0] if result else {"total": 0, "sessions": 0}
    
    elapsed = None
    if active:
        start = datetime.fromisoformat(active["start_time"])
        elapsed = (now - start).total_seconds() / 60.0
        
    total_today = (completed["total"] or 0) + (elapsed or 0)
    return {
        "is_active": bool(active),
        "session_start": active["start_time"] if active else None,
        "elapsed_minutes": round(elapsed, 1) if elapsed else None,
        "total_minutes_today": round(total_today, 1),
        "total_hours_today": round(total_today / 60.0, 2),
        "sessions_today": completed.get("sessions", 0),
        "goal_hit": total_today >= 240,  # 4 hours
    }

@router.get("/deepwork/history")
def get_deepwork_history(days: int = 30):
    """Returns daily deep work totals for last N days."""
    db = get_db()
    # MongoDB aggregation to extract substring date and group
    pipeline = [
        {"$match": {"end_time": {"$exists": True}}},
        {"$project": {"day": {"$substr": ["$start_time", 0, 10]}, "duration_minutes": 1}},
        {"$group": {"_id": "$day", "total_minutes": {"$sum": "$duration_minutes"}, "sessions": {"$sum": 1}}},
        {"$sort": {"_id": -1}},
        {"$limit": days}
    ]
    rows = list(db.deepwork_logs.aggregate(pipeline))
    
    return [
        {
            "date": r["_id"],
            "total_minutes": round(r["total_minutes"], 1),
            "total_hours": round(r["total_minutes"] / 60.0, 2),
            "sessions": r["sessions"],
            "goal_hit": r["total_minutes"] >= 240
        }
        for r in rows
    ]

# ─────────────────────────────────────────────────────────────────────────────
# PROGRESS / MULTI-RANGE ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

def _parse_range(range_str: str) -> int:
    mapping = {"7d": 7, "14d": 14, "30d": 30, "90d": 90, "180d": 180, "365d": 365}
    return mapping.get(range_str, 30)

@router.get("/sleep/progress")
def get_sleep_progress(range: str = "30d"):
    days = _parse_range(range)
    goal_hours = 7.5
    cutoff_date = (date.today() - timedelta(days=days)).isoformat()
    
    db = get_db()
    pipeline = [
        {"$match": {"end_time": {"$exists": True}, "start_time": {"$gte": cutoff_date}}},
        {"$project": {"day": {"$substr": ["$start_time", 0, 10]}, "duration_minutes": 1}},
        {"$group": {"_id": "$day", "total_minutes": {"$sum": "$duration_minutes"}, "sessions": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    rows = list(db.sleep_logs.aggregate(pipeline))
    
    data_points = []
    total_hours_sum = 0
    goal_hits = 0
    for r in rows:
        hours = round(r["total_minutes"] / 60.0, 2)
        hit = hours >= goal_hours
        if hit:
            goal_hits += 1
        total_hours_sum += hours
        data_points.append({
            "date": r["_id"],
            "hours": hours,
            "minutes": round(r["total_minutes"], 1),
            "sessions": r["sessions"],
            "goal_hit": hit,
        })
    
    avg_hours = round(total_hours_sum / len(data_points), 2) if data_points else 0
    return {
        "range": range,
        "days_requested": days,
        "data": data_points,
        "summary": {
            "total_sessions": len(data_points),
            "avg_hours": avg_hours,
            "goal_hours": goal_hours,
            "goal_compliance_pct": round((goal_hits / len(data_points)) * 100) if data_points else 0,
            "best_night_hours": max((d["hours"] for d in data_points), default=0),
            "worst_night_hours": min((d["hours"] for d in data_points), default=0),
        }
    }

@router.get("/fast/progress")
def get_fast_progress(range: str = "30d"):
    days = _parse_range(range)
    goal_hours = 16
    cutoff_date = (date.today() - timedelta(days=days)).isoformat()
    
    db = get_db()
    pipeline = [
        {"$match": {"end_time": {"$exists": True}, "start_time": {"$gte": cutoff_date}}},
        {"$project": {"day": {"$substr": ["$start_time", 0, 10]}, "duration_minutes": 1}},
        {"$sort": {"start_time": 1}}
    ]
    rows = list(db.fast_logs.aggregate(pipeline))
    
    data_points = []
    goal_hits = 0
    total_hours = 0
    current_streak = 0
    max_streak = 0
    for r in rows:
        hours = round(r.get("duration_minutes", 0) / 60.0, 2)
        hit = hours >= goal_hours
        total_hours += hours
        if hit:
            goal_hits += 1
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 0
        data_points.append({
            "date": r["day"],
            "hours": hours,
            "minutes": round(r.get("duration_minutes", 0), 1),
            "goal_hit": hit,
            "phase": _fast_phase(r.get("duration_minutes", 0)),
        })
    
    avg_hours = round(total_hours / len(data_points), 2) if data_points else 0
    return {
        "range": range,
        "data": data_points,
        "summary": {
            "total_fasts": len(data_points),
            "avg_hours": avg_hours,
            "goal_hours": goal_hours,
            "goal_compliance_pct": round((goal_hits / len(data_points)) * 100) if data_points else 0,
            "longest_fast_hours": max((d["hours"] for d in data_points), default=0),
            "current_streak": current_streak,
            "max_streak": max_streak,
        }
    }

@router.get("/hydration/progress")
def get_hydration_progress(range: str = "30d"):
    days = _parse_range(range)
    goal_ml = 4500
    cutoff_date = (date.today() - timedelta(days=days)).isoformat()
    
    db = get_db()
    pipeline = [
        {"$match": {"date": {"$gte": cutoff_date}}},
        {"$group": {"_id": "$date", "total_ml": {"$sum": "$amount_ml"}}},
        {"$sort": {"_id": 1}}
    ]
    rows = list(db.hydration_logs.aggregate(pipeline))
    
    data_points = []
    goal_hits = 0
    total_ml = 0
    for r in rows:
        ml = r["total_ml"]
        total_ml += ml
        hit = ml >= goal_ml
        if hit:
            goal_hits += 1
        data_points.append({
            "date": r["_id"],
            "ml": ml,
            "liters": round(ml / 1000, 2),
            "goal_hit": hit,
            "percent": min(100, round((ml / goal_ml) * 100)),
        })
    
    avg_ml = round(total_ml / len(data_points)) if data_points else 0
    return {
        "range": range,
        "data": data_points,
        "summary": {
            "total_days": len(data_points),
            "avg_ml": avg_ml,
            "avg_liters": round(avg_ml / 1000, 2),
            "goal_ml": goal_ml,
            "goal_compliance_pct": round((goal_hits / len(data_points)) * 100) if data_points else 0,
            "best_day_ml": max((d["ml"] for d in data_points), default=0),
        }
    }

@router.get("/deepwork/progress")
def get_deepwork_progress(range: str = "30d"):
    days = _parse_range(range)
    goal_minutes = 240
    cutoff_date = (date.today() - timedelta(days=days)).isoformat()
    
    db = get_db()
    pipeline = [
        {"$match": {"end_time": {"$exists": True}, "start_time": {"$gte": cutoff_date}}},
        {"$project": {"day": {"$substr": ["$start_time", 0, 10]}, "duration_minutes": 1}},
        {"$group": {"_id": "$day", "total_minutes": {"$sum": "$duration_minutes"}, "sessions": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    rows = list(db.deepwork_logs.aggregate(pipeline))
    
    data_points = []
    goal_hits = 0
    total_minutes = 0
    for r in rows:
        mins = round(r["total_minutes"], 1)
        total_minutes += mins
        hit = mins >= goal_minutes
        if hit:
            goal_hits += 1
        data_points.append({
            "date": r["_id"],
            "minutes": mins,
            "hours": round(mins / 60.0, 2),
            "sessions": r["sessions"],
            "goal_hit": hit,
        })
    
    avg_hours = round((total_minutes / len(data_points)) / 60.0, 2) if data_points else 0
    return {
        "range": range,
        "data": data_points,
        "summary": {
            "total_days": len(data_points),
            "avg_hours": avg_hours,
            "goal_hours": goal_minutes / 60,
            "goal_compliance_pct": round((goal_hits / len(data_points)) * 100) if data_points else 0,
            "total_sessions": sum(d["sessions"] for d in data_points),
            "best_day_hours": max((d["hours"] for d in data_points), default=0),
        }
    }

@router.get("/readiness/progress")
def get_readiness_progress(range: str = "30d"):
    days = _parse_range(range)
    cutoff_date = (date.today() - timedelta(days=days)).isoformat()
    
    db = get_db()
    rows = list(db.readiness_logs.find({"date": {"$gte": cutoff_date}}).sort("date", 1))
    
    data_points = []
    total_score = 0
    for r in rows:
        total_score += r["score"]
        data_points.append({
            "date": r["date"],
            "score": r["score"],
            "energy": r["energy"],
            "clarity": r["clarity"],
            "mood": r["mood"],
            "label": _readiness_label(r["score"]),
        })
    
    avg_score = round(total_score / len(data_points), 1) if data_points else 0
    return {
        "range": range,
        "data": data_points,
        "summary": {
            "total_days": len(data_points),
            "avg_score": avg_score,
            "max_score": 15,
            "best_day_score": max((d["score"] for d in data_points), default=0),
            "peak_state_days": sum(1 for d in data_points if d["score"] >= 13),
        }
    }
