from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from api.database import get_db
from pathlib import Path
import os
import json
import time
from openai import OpenAI
from api.database import get_db

VALID_MUSCLES = [
    "chest", "upper-back", "lower-back", "front-deltoids", "quadriceps", 
    "calves", "gluteal", "abs", "biceps", "triceps", "forearm", "hamstring", 
    "trapezius", "neck"
]
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
                    
                    protocol_snapshot = get_all_protocol_statuses(
                        target_date=workout.date, is_ramadan=is_ramadan
                    )
                    
                    # Atomic update to avoid race conditions
                    db.daily_logs.update_one(
                        {"date": workout.date}, 
                        {"$set": {
                            "non_negotiables.physical_training": True,
                            "xp_earned": xp_result["total_xp"],
                            "active_penalties": xp_result["penalties_active"],
                            "perks_unlocked": [p["name"] for p in xp_result["perks_unlocked"]],
                            "protocol_status": protocol_snapshot.get("summary", {})
                        }}
                    )
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    print(f"[WORKOUT DB] XP Engine recalculate failed: {e}")
        except Exception as e:
            import traceback
            traceback.print_exc()
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


# ─────────────────────────────────────────────────────────────────────────────
# HOME PROTOCOLS (MICRO-WORKOUTS)
# ─────────────────────────────────────────────────────────────────────────────

class HomeProtocolIncrement(BaseModel):
    variant: str
    count: int = 1

class HomeProtocolDelete(BaseModel):
    variant: str

class HomeProtocolRename(BaseModel):
    old_variant: str
    new_variant: str

class HomeProtocolDecrement(BaseModel):
    variant: str
    count: int = 1

class HomeProtocolReorder(BaseModel):
    order: list[str]


@router.get("/home-protocol/today")
def get_home_protocol_today():
    db = get_db()
    today_str = date.today().isoformat()
    doc = db.home_protocols.find_one({"date": today_str}, {"_id": 0})
    if not doc:
        return {"pushups": 0, "pullups": 0, "squats": 0, "core": 0}
    return doc

@router.post("/home-protocol/increment")
def increment_home_protocol(req: HomeProtocolIncrement):
    db = get_db()
    today_str = date.today().isoformat()
    
    variant_key = req.variant.lower()
    db.home_protocols.update_one(
        {"date": today_str},
        {"$inc": {variant_key: req.count}},
        upsert=True
    )
    doc = db.home_protocols.find_one({"date": today_str}, {"_id": 0})
    if doc:
        doc.pop("_id", None)
    return doc or {}

@router.post("/home-protocol/delete")
def delete_home_protocol(req: HomeProtocolDelete):
    db = get_db()
    today_str = date.today().isoformat()
    variant_key = req.variant.lower()
    db.home_protocols.update_one(
        {"date": today_str},
        {"$unset": {variant_key: ""}}
    )
    doc = db.home_protocols.find_one({"date": today_str}, {"_id": 0})
    if doc:
        doc.pop("_id", None)
    return doc or {}

@router.post("/home-protocol/rename")
def rename_home_protocol(req: HomeProtocolRename):
    db = get_db()
    today_str = date.today().isoformat()
    old_key = req.old_variant.lower()
    new_key = req.new_variant.lower()
    
    db.home_protocols.update_one(
        {"date": today_str},
        {"$rename": {old_key: new_key}}
    )
    doc = db.home_protocols.find_one({"date": today_str}, {"_id": 0})
    if doc:
        doc.pop("_id", None)
    return doc or {}

@router.post("/home-protocol/decrement")
def decrement_home_protocol(req: HomeProtocolDecrement):
    db = get_db()
    today_str = date.today().isoformat()
    variant_key = req.variant.lower()
    
    # We shouldn't let it drop below 0 natively, but since we just store the number,
    # let's fetch current and decrement
    doc = db.home_protocols.find_one({"date": today_str})
    if doc and doc.get(variant_key, 0) > 0:
        new_val = max(0, doc.get(variant_key, 0) - req.count)
        db.home_protocols.update_one(
            {"date": today_str},
            {"$set": {variant_key: new_val}}
        )
    
    final_doc = db.home_protocols.find_one({"date": today_str}, {"_id": 0})
    if final_doc:
        final_doc.pop("_id", None)
    return final_doc or {}

@router.post("/home-protocol/reorder")
def reorder_home_protocol(req: HomeProtocolReorder):
    db = get_db()
    today_str = date.today().isoformat()
    
    db.home_protocols.update_one(
        {"date": today_str},
        {"$set": {"_order": [x.lower() for x in req.order]}},
        upsert=True
    )
    doc = db.home_protocols.find_one({"date": today_str}, {"_id": 0})
    if doc:
        doc.pop("_id", None)
    return doc or {}



# ─────────────────────────────────────────────────────────────────────────────
# MUSCLE HEATMAP ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────

def classify_exercise_muscles(exercise_name: str) -> dict:
    db = get_db()
    cached = db.ai_muscle_cache.find_one({"exercise_name": exercise_name})
    if cached:
        return cached.get("muscles", {})

    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=os.environ.get("NVIDIA_API_KEY")
    )
    
    prompt = f"""
    Analyze the exercise: '{exercise_name}'.
    Return a JSON dictionary mapping the primary and secondary muscle groups activated to a float representing the percentage of load.
    Example: {{"chest": 0.7, "triceps": 0.2, "front-deltoids": 0.1}}
    IMPORTANT: You must ONLY use the following exact keys: {', '.join(VALID_MUSCLES)}.
    Return ONLY valid JSON and no other text or explanation.
    """
    
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="meta/llama-3.1-70b-instruct",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=1024,
            )
            
            content = response.choices[0].message.content.strip()
            
            # Clean up markdown JSON block if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            result = json.loads(content)
            
            # Save to MongoDB
            if result and len(result.keys()) > 0:
                db.ai_muscle_cache.update_one(
                    {"exercise_name": exercise_name}, 
                    {"$set": {"muscles": result}}, 
                    upsert=True
                )
                return result
            else:
                raise ValueError("Empty dictionary returned from AI")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[AI RETRY {attempt+1}/3] Error classifying muscles for {exercise_name}: {e}")
            time.sleep(2 ** attempt)
            
    print(f"Failed all retries classifying muscles for {exercise_name}. Caching empty dict to prevent blocking.")
    db.ai_muscle_cache.update_one(
        {"exercise_name": exercise_name}, 
        {"$set": {"muscles": {}}}, 
        upsert=True
    )
    return {}

@router.get("/heatmap")
def get_muscle_heatmap(days: int = 7):
    """
    Calculates muscle growth metrics.
    Returns:
    - activation: Muscles worked TODAY (immediate pump/hypertrophy stimulus)
    - armor: Accumulated volume over the last N days (structural progression)
    """
    db = get_db()
    
    today_str = date.today().isoformat()
    target_date = (date.today() - timedelta(days=days)).isoformat()
    
    # Fetch workouts from the last N days
    cursor = db.workouts.find({"date": {"$gte": target_date}}, {"_id": 0})
    workouts = list(cursor)
    
    # Fetch home protocols from the last N days
    hp_cursor = db.home_protocols.find({"date": {"$gte": target_date}}, {"_id": 0})
    home_protocols = list(hp_cursor)
    
    activation_vol = {m: 0 for m in VALID_MUSCLES}
    armor_vol = {m: 0 for m in VALID_MUSCLES}
    
    for w in workouts:
        w_date = w.get("date")
        is_today = w_date == today_str
        
        for ex in w.get("exercises", []):
            ex_name = ex.get("exercise_name", "").lower().strip()
            
            # Fetch dynamic muscles mapping from AI cache
            muscles_dict = classify_exercise_muscles(ex_name)
            
            ex_vol = 0
            for s in ex.get("sets", []):
                if s.get("completed", True):
                    weight = float(s.get("weight", 0) or 0)
                    reps = int(s.get("reps", 0) or 0)
                    
                    # Sanity Caps to prevent 7-Day Armor Exploits
                    weight = min(weight, 400.0)
                    reps = min(reps, 100)
                    
                    if weight == 0 and reps > 0: weight = 70 
                    ex_vol += (weight * reps)
            
            # Distribute volume based on load percentage
            for m, load_pct in muscles_dict.items():
                if m not in activation_vol:
                    activation_vol[m] = 0
                    armor_vol[m] = 0
                
                muscle_vol = ex_vol * load_pct
                
                armor_vol[m] += muscle_vol
                if is_today:
                    activation_vol[m] += muscle_vol

    # Process Home Protocols Dynamically
    for hp in home_protocols:
        hp_date = hp.get("date")
        is_today = hp_date == today_str
        
        # Loop over ALL keys dynamically except 'date' and '_id'
        for variant, count in hp.items():
            if variant in ["date", "_id"] or not isinstance(count, int) or count <= 0:
                continue
            
            # Default weight for bodyweight tracking
            bw_weight = 70.0
            
            # Some hardcoded weights for basics, otherwise treat as 1:1 bodyweight load
            if "pushup" in variant.lower(): ex_vol = bw_weight * 0.65 * count
            elif "pullup" in variant.lower(): ex_vol = bw_weight * 1.0 * count
            elif "squat" in variant.lower(): ex_vol = bw_weight * 1.0 * count
            elif "core" in variant.lower() or "abs" in variant.lower(): ex_vol = bw_weight * 0.5 * count
            else: ex_vol = bw_weight * 0.8 * count  # Default multiplier for unknown exercises
            
            # The Magic: Route the dynamic string through the AI Biomechanics Engine
            muscles_dict = classify_exercise_muscles(variant)
            for m, load_pct in muscles_dict.items():
                if m not in activation_vol:
                    activation_vol[m] = 0
                    armor_vol[m] = 0
                
                muscle_vol = ex_vol * load_pct
                
                armor_vol[m] += muscle_vol
                if is_today:
                    activation_vol[m] += muscle_vol

    # Normalization Caps
    DAILY_CAP = 3000.0  
    WEEKLY_CAP = 12000.0 
    
    activation = {}
    armor = {}
    
    for m in activation_vol:
        activation[m] = min(100, int((activation_vol[m] / DAILY_CAP) * 100))
        armor[m] = min(100, int((armor_vol[m] / WEEKLY_CAP) * 100))

    return {
        "activation": activation,
        "armor": armor
    }

@router.post("/session/start")
def start_workout_session(target_date: Optional[str] = None):
    db = get_db()
    today_str = target_date or date.today().isoformat()
    now_ts = int(datetime.utcnow().timestamp() * 1000)
    db.workouts_active_sessions.update_one(
        {"date": today_str},
        {"$setOnInsert": {"start_time": now_ts}},
        upsert=True
    )
    doc = db.workouts_active_sessions.find_one({"date": today_str})
    return {"start_time": doc["start_time"]}

