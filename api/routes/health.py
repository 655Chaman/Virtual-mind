from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import sqlite3
from pathlib import Path

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = PROJECT_ROOT / "data" / "health.db"

def get_db_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db_conn() as conn:
        # ── Sleep ──────────────────────────────────────────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sleep_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_minutes REAL
            )
        """)

        # ── Morning Readiness ──────────────────────────────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS readiness_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                energy INTEGER NOT NULL,
                clarity INTEGER NOT NULL,
                mood INTEGER NOT NULL,
                score INTEGER NOT NULL,
                sleep_id INTEGER,
                FOREIGN KEY (sleep_id) REFERENCES sleep_logs (id)
            )
        """)

        # ── Fasting ────────────────────────────────────────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS fast_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_minutes REAL,
                goal_minutes REAL DEFAULT 960
            )
        """)

        # ── Hydration ──────────────────────────────────────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS hydration_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                amount_ml INTEGER NOT NULL,
                logged_at TEXT NOT NULL
            )
        """)

        # ── Deep Work ──────────────────────────────────────────────────────────
        conn.execute("""
            CREATE TABLE IF NOT EXISTS deepwork_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                start_time TEXT NOT NULL,
                end_time TEXT,
                duration_minutes REAL,
                label TEXT DEFAULT '',
                journal_entry TEXT DEFAULT ''
            )
        """)
        try:
            conn.execute("ALTER TABLE deepwork_logs ADD COLUMN journal_entry TEXT DEFAULT ''")
        except sqlite3.OperationalError:
            pass

init_db()

# ─────────────────────────────────────────────────────────────────────────────
# SLEEP ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/sleep/start")
def start_sleep():
    """Logs the exact timestamp when the user goes to bed."""
    current_time = datetime.utcnow().isoformat()
    with get_db_conn() as conn:
        cursor = conn.execute("SELECT id FROM sleep_logs WHERE end_time IS NULL")
        if cursor.fetchone():
            return {"status": "error", "message": "Already sleeping."}
        conn.execute("INSERT INTO sleep_logs (start_time) VALUES (?)", (current_time,))
    return {"status": "success", "start_time": current_time}

@router.post("/sleep/stop")
def stop_sleep():
    """Logs the wake-up time and calculates duration."""
    now = datetime.utcnow()
    now_iso = now.isoformat()
    with get_db_conn() as conn:
        cursor = conn.execute(
            "SELECT id, start_time FROM sleep_logs WHERE end_time IS NULL ORDER BY id DESC LIMIT 1"
        )
        session = cursor.fetchone()
        if not session:
            return {"status": "error", "message": "No active sleep session."}
        start = datetime.fromisoformat(session["start_time"])
        duration = (now - start).total_seconds() / 60.0
        conn.execute(
            "UPDATE sleep_logs SET end_time = ?, duration_minutes = ? WHERE id = ?",
            (now_iso, duration, session["id"])
        )
    return {
        "status": "success",
        "sleep_id": session["id"],
        "duration_minutes": duration,
        "duration_hours": round(duration / 60.0, 2)
    }

@router.get("/sleep/today")
def get_sleep_status():
    """Returns current sleep state and last completed session."""
    with get_db_conn() as conn:
        active = conn.execute(
            "SELECT start_time FROM sleep_logs WHERE end_time IS NULL ORDER BY id DESC LIMIT 1"
        ).fetchone()
        last = conn.execute(
            "SELECT start_time, end_time, duration_minutes FROM sleep_logs WHERE end_time IS NOT NULL ORDER BY id DESC LIMIT 1"
        ).fetchone()
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
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT start_time, end_time, duration_minutes 
               FROM sleep_logs WHERE end_time IS NOT NULL 
               ORDER BY start_time DESC LIMIT ?""",
            (days,)
        ).fetchall()
    return [
        {
            "start_time": r["start_time"],
            "end_time": r["end_time"],
            "duration_hours": round(r["duration_minutes"] / 60.0, 2)
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
    sleep_id: Optional[int] = None

@router.post("/readiness")
def log_readiness(data: ReadinessInput):
    """Logs the morning readiness check-in (energy, clarity, mood)."""
    if not all(1 <= v <= 5 for v in [data.energy, data.clarity, data.mood]):
        return {"status": "error", "message": "All values must be between 1 and 5."}
    today = date.today().isoformat()
    score = data.energy + data.clarity + data.mood
    with get_db_conn() as conn:
        conn.execute(
            """INSERT INTO readiness_logs (date, energy, clarity, mood, score, sleep_id)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT(date) DO UPDATE SET
                 energy=excluded.energy, clarity=excluded.clarity,
                 mood=excluded.mood, score=excluded.score""",
            (today, data.energy, data.clarity, data.mood, score, data.sleep_id)
        )
    return {"status": "success", "date": today, "score": score, "max": 15}

@router.get("/readiness/today")
def get_readiness_today():
    """Returns today's readiness score if logged."""
    today = date.today().isoformat()
    with get_db_conn() as conn:
        row = conn.execute(
            "SELECT * FROM readiness_logs WHERE date = ?", (today,)
        ).fetchone()
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
    with get_db_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM readiness_logs ORDER BY date DESC LIMIT ?", (days,)
        ).fetchall()
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
    with get_db_conn() as conn:
        active = conn.execute(
            "SELECT id FROM fast_logs WHERE end_time IS NULL"
        ).fetchone()
        if active:
            return {"status": "error", "message": "Fast already in progress."}
        conn.execute("INSERT INTO fast_logs (start_time) VALUES (?)", (now_iso,))
    return {"status": "success", "start_time": now_iso}

@router.post("/fast/stop")
def stop_fast():
    """Ends the current fasting window."""
    now = datetime.utcnow()
    now_iso = now.isoformat()
    with get_db_conn() as conn:
        session = conn.execute(
            "SELECT id, start_time FROM fast_logs WHERE end_time IS NULL ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not session:
            return {"status": "error", "message": "No active fast."}
        start = datetime.fromisoformat(session["start_time"])
        duration = (now - start).total_seconds() / 60.0
        conn.execute(
            "UPDATE fast_logs SET end_time = ?, duration_minutes = ? WHERE id = ?",
            (now_iso, duration, session["id"])
        )
    return {
        "status": "success",
        "duration_minutes": duration,
        "duration_hours": round(duration / 60.0, 2)
    }

@router.get("/fast/today")
def get_fast_status():
    """Returns current fasting state and last completed fast."""
    with get_db_conn() as conn:
        active = conn.execute(
            "SELECT start_time FROM fast_logs WHERE end_time IS NULL ORDER BY id DESC LIMIT 1"
        ).fetchone()
        last = conn.execute(
            "SELECT start_time, end_time, duration_minutes FROM fast_logs WHERE end_time IS NOT NULL ORDER BY id DESC LIMIT 1"
        ).fetchone()
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
        "last_fast_hours": round(last["duration_minutes"] / 60.0, 2) if last else None,
    }

@router.get("/fast/history")
def get_fast_history(days: int = 30):
    """Returns fasting history for the last N days."""
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT start_time, end_time, duration_minutes
               FROM fast_logs WHERE end_time IS NOT NULL
               ORDER BY start_time DESC LIMIT ?""",
            (days,)
        ).fetchall()
    return [
        {
            "start_time": r["start_time"],
            "end_time": r["end_time"],
            "duration_hours": round(r["duration_minutes"] / 60.0, 2),
            "goal_hit": r["duration_minutes"] >= 960  # 16 hours
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
    today = date.today().isoformat()
    now_iso = datetime.utcnow().isoformat()
    with get_db_conn() as conn:
        conn.execute(
            "INSERT INTO hydration_logs (date, amount_ml, logged_at) VALUES (?, ?, ?)",
            (today, data.amount_ml, now_iso)
        )
        total = conn.execute(
            "SELECT SUM(amount_ml) as total FROM hydration_logs WHERE date = ?", (today,)
        ).fetchone()["total"] or 0
    return {"status": "success", "today_total_ml": total, "today_total_L": round(total / 1000, 2)}

@router.get("/hydration/today")
def get_hydration_today():
    """Returns today's total hydration intake."""
    today = date.today().isoformat()
    goal_ml = 4500 # Baseline consistent target

    # Check workout DB for rest day status to adjust range
    workout_db = PROJECT_ROOT / "data" / "workout.db"
    try:
        if workout_db.exists():
            with sqlite3.connect(str(workout_db)) as wconn:
                wconn.row_factory = sqlite3.Row
                row = wconn.execute("SELECT is_rest_day FROM workouts WHERE date = ?", (today,)).fetchone()
                if row:
                    goal_ml = 4000 if row["is_rest_day"] == 1 else 5000
    except Exception as e:
        pass # fallback to 4500
        
    with get_db_conn() as conn:
        total = conn.execute(
            "SELECT SUM(amount_ml) as total FROM hydration_logs WHERE date = ?", (today,)
        ).fetchone()["total"] or 0
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
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT date, SUM(amount_ml) as total_ml
               FROM hydration_logs
               GROUP BY date ORDER BY date DESC LIMIT ?""",
            (days,)
        ).fetchall()
    return [{"date": r["date"], "total_ml": r["total_ml"], "total_L": round(r["total_ml"] / 1000, 2)} for r in rows]

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
    with get_db_conn() as conn:
        active = conn.execute(
            "SELECT id FROM deepwork_logs WHERE end_time IS NULL"
        ).fetchone()
        if active:
            return {"status": "error", "message": "Session already active."}
        conn.execute(
            "INSERT INTO deepwork_logs (start_time, journal_entry) VALUES (?, ?)", 
            (now_iso, data.journal_entry)
        )
    return {"status": "success", "start_time": now_iso}

@router.post("/deepwork/stop")
def stop_deepwork(data: DeepWorkStopInput):
    """Ends the current deep work session."""
    now = datetime.utcnow()
    now_iso = now.isoformat()
    with get_db_conn() as conn:
        session = conn.execute(
            "SELECT id, start_time FROM deepwork_logs WHERE end_time IS NULL ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not session:
            return {"status": "error", "message": "No active session."}
        start = datetime.fromisoformat(session["start_time"])
        duration = (now - start).total_seconds() / 60.0
        conn.execute(
            "UPDATE deepwork_logs SET end_time = ?, duration_minutes = ?, label = ? WHERE id = ?",
            (now_iso, duration, data.label or "", session["id"])
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
    with get_db_conn() as conn:
        active = conn.execute(
            "SELECT start_time FROM deepwork_logs WHERE end_time IS NULL ORDER BY id DESC LIMIT 1"
        ).fetchone()
        completed = conn.execute(
            """SELECT SUM(duration_minutes) as total, COUNT(*) as sessions
               FROM deepwork_logs WHERE end_time IS NOT NULL AND date(start_time) = ?""",
            (today,)
        ).fetchone()
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
        "sessions_today": completed["sessions"] or 0,
        "goal_hit": total_today >= 240,  # 4 hours
    }

@router.get("/deepwork/history")
def get_deepwork_history(days: int = 30):
    """Returns daily deep work totals for last N days."""
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT date(start_time) as day, SUM(duration_minutes) as total_minutes, COUNT(*) as sessions
               FROM deepwork_logs WHERE end_time IS NOT NULL
               GROUP BY day ORDER BY day DESC LIMIT ?""",
            (days,)
        ).fetchall()
    return [
        {
            "date": r["day"],
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
    """Parse range string like '7d', '14d', '30d', '90d', '180d', '365d' into days."""
    mapping = {"7d": 7, "14d": 14, "30d": 30, "90d": 90, "180d": 180, "365d": 365}
    return mapping.get(range_str, 30)


@router.get("/sleep/progress")
def get_sleep_progress(range: str = "30d"):
    """Returns daily sleep data with averages, trends, and goal compliance."""
    days = _parse_range(range)
    goal_hours = 7.5
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT date(start_time) as day, SUM(duration_minutes) as total_minutes, COUNT(*) as sessions
               FROM sleep_logs WHERE end_time IS NOT NULL
               AND start_time >= date('now', ? || ' days')
               GROUP BY day ORDER BY day ASC""",
            (f"-{days}",)
        ).fetchall()
    
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
            "date": r["day"],
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
    """Returns fasting data with goal compliance over time."""
    days = _parse_range(range)
    goal_hours = 16
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT date(start_time) as day, duration_minutes, start_time, end_time
               FROM fast_logs WHERE end_time IS NOT NULL
               AND start_time >= date('now', ? || ' days')
               ORDER BY start_time ASC""",
            (f"-{days}",)
        ).fetchall()
    
    data_points = []
    goal_hits = 0
    total_hours = 0
    current_streak = 0
    max_streak = 0
    for r in rows:
        hours = round(r["duration_minutes"] / 60.0, 2)
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
            "minutes": round(r["duration_minutes"], 1),
            "goal_hit": hit,
            "phase": _fast_phase(r["duration_minutes"]),
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
    """Returns daily hydration data with goal compliance."""
    days = _parse_range(range)
    goal_ml = 4500
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT date, SUM(amount_ml) as total_ml
               FROM hydration_logs
               WHERE date >= date('now', ? || ' days')
               GROUP BY date ORDER BY date ASC""",
            (f"-{days}",)
        ).fetchall()
    
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
            "date": r["date"],
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
    """Returns daily deep work data with goal compliance."""
    days = _parse_range(range)
    goal_minutes = 240  # 4 hours
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT date(start_time) as day, SUM(duration_minutes) as total_minutes, COUNT(*) as sessions
               FROM deepwork_logs WHERE end_time IS NOT NULL
               AND start_time >= date('now', ? || ' days')
               GROUP BY day ORDER BY day ASC""",
            (f"-{days}",)
        ).fetchall()
    
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
            "date": r["day"],
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
    """Returns readiness score trend data."""
    days = _parse_range(range)
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT date, score, energy, clarity, mood
               FROM readiness_logs
               WHERE date >= date('now', ? || ' days')
               ORDER BY date ASC""",
            (f"-{days}",)
        ).fetchall()
    
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
