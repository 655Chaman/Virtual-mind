from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from api.database import get_db
from pathlib import Path

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

class SetLog(BaseModel):
    set_number: int
    weight: float
    reps: int
    completed: bool = True

class ExerciseLog(BaseModel):
    exercise_name: str
    sets: List[SetLog]

class WorkoutLog(BaseModel):
    date: str
    day_name: str
    split_name: str
    is_rest_day: bool = False
    exercises: List[ExerciseLog] = []
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

DAILY_WORKOUT_TEMPLATE = {
    "split_name": "Daily Core Routine",
    "is_rest_day": False,
    "exercises": [
        "Barbell Squats",
        "Flat Bench Press",
        "Barbell Rows",
        "Overhead Press",
        "Deadlifts"
    ]
}

@router.get("/today")
def get_today_workout():
    """Returns today's workout if logged in MongoDB, or defaults to the split template."""
    today_str = date.today().isoformat()
    db = get_db()
    
    workout = db.workouts.find_one({"date": today_str}, {"_id": 0})
    if workout:
        return {
            "logged": True,
            "workout": workout
        }
            
    # Default template
    day_name = date.today().strftime("%A")
    split_info = DAILY_WORKOUT_TEMPLATE
    
    return {
        "logged": False,
        "workout": {
            "date": today_str,
            "day_name": day_name,
            "split_name": split_info["split_name"],
            "is_rest_day": split_info["is_rest_day"],
            "exercises": [{"exercise_name": name, "sets": []} for name in split_info["exercises"]],
            "duration_minutes": 80,
            "notes": ""
        }
    }

@router.post("/log")
def log_workout(workout: WorkoutLog):
    """Saves a workout log to MongoDB, and updates the daily non-negotiables log."""
    db = get_db()
    workout_dict = workout.model_dump()
    
    db.workouts.update_one({"date": workout.date}, {"$set": workout_dict}, upsert=True)
                
    # Auto-complete "physical_training" in the daily log for this date if it exists
    daily_log = db.daily_logs.find_one({"date": workout.date})
    if daily_log:
        try:
            nns = daily_log.get("non_negotiables", {})
            if not nns.get("physical_training", False):
                nns["physical_training"] = True
                daily_log["non_negotiables"] = nns
                
                # Recompute daily log XP
                try:
                    from brain.xp_engine import compute_xp_from_log
                    from brain.aos_protocols import get_all_protocol_statuses
                    
                    is_ramadan = nns.get("ramadan_mode_active", False)
                    xp_result = compute_xp_from_log(daily_log, is_ramadan=is_ramadan)
                    daily_log["xp_earned"] = xp_result["total_xp"]
                    daily_log["active_penalties"] = xp_result["penalties_active"]
                    daily_log["perks_unlocked"] = [p["name"] for p in xp_result["perks_unlocked"]]
                    
                    protocol_snapshot = get_all_protocol_statuses(
                        target_date=workout.date, is_ramadan=is_ramadan
                    )
                    daily_log["protocol_status"] = protocol_snapshot.get("summary", {})
                except Exception as e:
                    print(f"[WORKOUT DB] XP Engine recalculate failed: {e}")
                
                db.daily_logs.update_one({"date": workout.date}, {"$set": daily_log})
        except Exception as e:
            print(f"[WORKOUT DB] Failed to auto-update daily log: {e}")
            
    return {"success": True, "date": workout.date}

@router.get("/history")
def get_workout_history(last: Optional[int] = Query(30, description="Number of workouts to return")):
    """Returns last N workout logs sorted by date descending."""
    db = get_db()
    cursor = db.workouts.find({}, {"_id": 0}).sort("date", -1).limit(last)
    return list(cursor)

@router.get("/exercise/{exercise_name}")
def get_exercise_history(exercise_name: str, target_date: Optional[str] = None):
    """Returns progressive history stats for a specific exercise."""
    db = get_db()
    
    query = {"exercises.exercise_name": {"$regex": f"^{exercise_name}$", "$options": "i"}}
    if target_date:
        query["date"] = {"$lt": target_date}
        
    cursor = db.workouts.find(query, {"_id": 0}).sort("date", -1)
    
    history = []
    for w in cursor:
        w_date = w.get("date")
        w_notes = w.get("notes")
        
        target_ex = next((ex for ex in w.get("exercises", []) if ex.get("exercise_name", "").lower() == exercise_name.lower()), None)
        
        if target_ex:
            history.append({
                "date": w_date,
                "sets": target_ex.get("sets", []),
                "notes": w_notes
            })
            
    # Calculate volume and estimated 1RM for each session
    for session in history:
        vol = 0.0
        max_1rm = 0.0
        max_weight = 0.0
        completed_sets = [s for s in session["sets"] if s.get("completed", True)]
        
        for s in completed_sets:
            w = float(s.get("weight", 0.0))
            r = int(s.get("reps", 0))
            vol += w * r
            max_weight = max(max_weight, w)
            if r > 0:
                one_rep_max = w * (1.0 + r / 30.0)
                max_1rm = max(max_1rm, one_rep_max)
                
        session["volume"] = vol
        session["max_weight"] = max_weight
        session["estimated_1rm"] = round(max_1rm, 2)
        
    return history
