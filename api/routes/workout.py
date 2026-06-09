from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import json
import sqlite3
import time
from pathlib import Path

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = PROJECT_ROOT / "data" / "workout.db"
LOGS_DIR = PROJECT_ROOT / "data" / "logs"

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

# Daily Core Routine template
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

def get_db_conn():
    """Returns SQLite database connection configured with Row factory."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes schema tables inside SQLite database if they don't exist."""
    with get_db_conn() as conn:
        # Workouts table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE,
                day_name TEXT,
                split_name TEXT,
                is_rest_day INTEGER,
                duration_minutes INTEGER,
                notes TEXT
            )
        """)
        # Exercises table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workout_id INTEGER,
                exercise_name TEXT,
                FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
            )
        """)
        # Sets table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                exercise_id INTEGER,
                set_number INTEGER,
                weight REAL,
                reps INTEGER,
                completed INTEGER,
                FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
            )
        """)

def migrate_json_to_sqlite():
    """Scans and migrates old JSON files to SQLite database on application import."""
    WORKOUTS_DIR = PROJECT_ROOT / "data" / "workouts"
    if not WORKOUTS_DIR.exists() or not WORKOUTS_DIR.is_dir():
        return
        
    files = list(WORKOUTS_DIR.glob("*.json"))
    if not files:
        return
        
    print(f"[WORKOUT DB] Migrating {len(files)} JSON files to SQLite...")
    
    with get_db_conn() as conn:
        for file_path in files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                w_date = data.get("date")
                if not w_date:
                    continue
                    
                # Skip if already in SQLite
                cursor = conn.execute("SELECT id FROM workouts WHERE date = ?", (w_date,))
                if cursor.fetchone():
                    continue
                    
                # Insert Workout record
                cursor = conn.execute(
                    """
                    INSERT INTO workouts (date, day_name, split_name, is_rest_day, duration_minutes, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        w_date,
                        data.get("day_name", ""),
                        data.get("split_name", ""),
                        1 if data.get("is_rest_day", False) else 0,
                        data.get("duration_minutes", 0),
                        data.get("notes", "")
                    )
                )
                workout_id = cursor.lastrowid
                
                # Insert exercises and their corresponding sets
                for ex in data.get("exercises", []):
                    ex_cursor = conn.execute(
                        "INSERT INTO exercises (workout_id, exercise_name) VALUES (?, ?)",
                        (workout_id, ex.get("exercise_name", ""))
                    )
                    ex_id = ex_cursor.lastrowid
                    
                    for s in ex.get("sets", []):
                        conn.execute(
                            """
                            INSERT INTO sets (exercise_id, set_number, weight, reps, completed)
                            VALUES (?, ?, ?, ?, ?)
                            """,
                            (
                                ex_id,
                                s.get("set_number", 1),
                                s.get("weight", 0.0),
                                s.get("reps", 0),
                                1 if s.get("completed", True) else 0
                            )
                        )
            except Exception as e:
                print(f"[WORKOUT DB] Failed to migrate {file_path.name}: {e}")
                
    # Archive JSON folders safely
    try:
        backup_path = PROJECT_ROOT / "data" / "workouts_migrated_backup"
        if backup_path.exists():
            backup_path = PROJECT_ROOT / "data" / f"workouts_migrated_backup_{int(time.time())}"
        WORKOUTS_DIR.rename(backup_path)
        print(f"[WORKOUT DB] Migration complete. JSON files backed up in {backup_path.name}")
    except Exception as e:
        print(f"[WORKOUT DB] Failed to archive JSON directory: {e}")

# Initialize schema and run migration
init_db()
migrate_json_to_sqlite()

@router.get("/today")
def get_today_workout():
    """Returns today's workout if logged in SQLite database, or defaults to the split template."""
    today_str = date.today().isoformat()
    
    with get_db_conn() as conn:
        cursor = conn.execute("SELECT * FROM workouts WHERE date = ?", (today_str,))
        row = cursor.fetchone()
        
        if row:
            workout_id = row["id"]
            # Get exercises
            ex_cursor = conn.execute("SELECT * FROM exercises WHERE workout_id = ?", (workout_id,))
            exercises = []
            
            for ex in ex_cursor.fetchall():
                ex_id = ex["id"]
                # Get sets
                sets_cursor = conn.execute("SELECT * FROM sets WHERE exercise_id = ? ORDER BY set_number ASC", (ex_id,))
                sets = [
                    {
                        "set_number": s["set_number"],
                        "weight": s["weight"],
                        "reps": s["reps"],
                        "completed": bool(s["completed"])
                    } for s in sets_cursor.fetchall()
                ]
                exercises.append({
                    "exercise_name": ex["exercise_name"],
                    "sets": sets
                })
                
            return {
                "logged": True,
                "workout": {
                    "date": row["date"],
                    "day_name": row["day_name"],
                    "split_name": row["split_name"],
                    "is_rest_day": bool(row["is_rest_day"]),
                    "exercises": exercises,
                    "duration_minutes": row["duration_minutes"],
                    "notes": row["notes"]
                }
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
    """Saves a workout log to SQLite, and updates the daily non-negotiables log."""
    with get_db_conn() as conn:
        # Delete existing workout for this date first (cascades down to delete old exercises/sets)
        conn.execute("DELETE FROM workouts WHERE date = ?", (workout.date,))
        
        # Insert new workout
        cursor = conn.execute(
            """
            INSERT INTO workouts (date, day_name, split_name, is_rest_day, duration_minutes, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                workout.date,
                workout.day_name,
                workout.split_name,
                1 if workout.is_rest_day else 0,
                workout.duration_minutes or 0,
                workout.notes or ""
            )
        )
        workout_id = cursor.lastrowid
        
        # Insert exercises and sets
        for ex in workout.exercises:
            ex_cursor = conn.execute(
                "INSERT INTO exercises (workout_id, exercise_name) VALUES (?, ?)",
                (workout_id, ex.exercise_name)
            )
            ex_id = ex_cursor.lastrowid
            
            for s in ex.sets:
                conn.execute(
                    """
                    INSERT INTO sets (exercise_id, set_number, weight, reps, completed)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        ex_id,
                        s.set_number,
                        s.weight,
                        s.reps,
                        1 if s.completed else 0
                    )
                )
                
    # Auto-complete "physical_training" in the daily log for this date if it exists
    daily_log_path = LOGS_DIR / f"{workout.date}.json"
    if daily_log_path.exists():
        try:
            with open(daily_log_path, "r", encoding="utf-8") as f:
                daily_log = json.load(f)
                
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
                
                with open(daily_log_path, "w", encoding="utf-8") as f:
                    json.dump(daily_log, f, indent=2)
        except Exception as e:
            print(f"[WORKOUT DB] Failed to auto-update daily log: {e}")
            
    return {"success": True, "date": workout.date}

@router.get("/history")
def get_workout_history(last: Optional[int] = Query(30, description="Number of workouts to return")):
    """Returns last N workout logs sorted by date descending."""
    workouts = []
    
    with get_db_conn() as conn:
        cursor = conn.execute("SELECT * FROM workouts ORDER BY date DESC LIMIT ?", (last,))
        workout_rows = cursor.fetchall()
        
        for w in workout_rows:
            w_id = w["id"]
            
            # Fetch exercises
            ex_cursor = conn.execute("SELECT * FROM exercises WHERE workout_id = ?", (w_id,))
            exercises = []
            
            for ex in ex_cursor.fetchall():
                ex_id = ex["id"]
                # Fetch sets
                sets_cursor = conn.execute("SELECT * FROM sets WHERE exercise_id = ? ORDER BY set_number ASC", (ex_id,))
                sets = [
                    {
                        "set_number": s["set_number"],
                        "weight": s["weight"],
                        "reps": s["reps"],
                        "completed": bool(s["completed"])
                    } for s in sets_cursor.fetchall()
                ]
                exercises.append({
                    "exercise_name": ex["exercise_name"],
                    "sets": sets
                })
                
            workouts.append({
                "date": w["date"],
                "day_name": w["day_name"],
                "split_name": w["split_name"],
                "is_rest_day": bool(w["is_rest_day"]),
                "exercises": exercises,
                "duration_minutes": w["duration_minutes"],
                "notes": w["notes"]
            })
            
    return workouts

@router.get("/exercise/{exercise_name}")
def get_exercise_history(exercise_name: str, target_date: Optional[str] = None):
    """Returns progressive history stats for a specific exercise."""
    history = []
    
    with get_db_conn() as conn:
        # Fetch exercises matching the target name
        query = """
            SELECT e.id as exercise_id, w.date, w.notes
            FROM exercises e
            JOIN workouts w ON e.workout_id = w.id
            WHERE LOWER(e.exercise_name) = LOWER(?)
        """
        params = [exercise_name]
        if target_date:
            query += " AND w.date < ?"
            params.append(target_date)
            
        query += " ORDER BY w.date DESC"
        
        cursor = conn.execute(query, params)
        ex_rows = cursor.fetchall()
        
        for row in ex_rows:
            ex_id = row["exercise_id"]
            w_date = row["date"]
            w_notes = row["notes"]
            
            # Fetch sets
            sets_cursor = conn.execute("SELECT * FROM sets WHERE exercise_id = ? ORDER BY set_number ASC", (ex_id,))
            sets = [
                {
                    "set_number": s["set_number"],
                    "weight": s["weight"],
                    "reps": s["reps"],
                    "completed": bool(s["completed"])
                } for s in sets_cursor.fetchall()
            ]
            
            history.append({
                "date": w_date,
                "sets": sets,
                "notes": w_notes
            })
            
    # Calculate volume and estimated 1RM for each session
    # 1RM formula (Epley): w * (1 + r/30)
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
