from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
import sqlite3
from pathlib import Path

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = PROJECT_ROOT / "data" / "sleep_protocol.db"


def get_db_conn():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sleep_protocol_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                bedtime_hour INTEGER NOT NULL DEFAULT 20,
                wake_hour INTEGER NOT NULL DEFAULT 5,
                enabled INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sleep_protocol_overrides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                reason TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sleep_protocol_compliance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                bedtime_target INTEGER NOT NULL,
                actual_sleep_start TEXT,
                compliant INTEGER NOT NULL DEFAULT 0,
                deviation_minutes INTEGER DEFAULT 0
            )
        """)
        # Insert default config if not exists
        existing = conn.execute("SELECT id FROM sleep_protocol_config WHERE id = 1").fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO sleep_protocol_config (id, bedtime_hour, wake_hour, enabled, updated_at) VALUES (1, 20, 5, 1, ?)",
                (datetime.utcnow().isoformat(),)
            )

init_db()


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

class ConfigInput(BaseModel):
    bedtime_hour: int = 20
    wake_hour: int = 5


@router.get("/status")
def get_protocol_status():
    """Returns current protocol state (active/inactive, time until lockout)."""
    now = datetime.now()
    hour = now.hour
    
    with get_db_conn() as conn:
        config = conn.execute("SELECT * FROM sleep_protocol_config WHERE id = 1").fetchone()
        today_override = conn.execute(
            "SELECT * FROM sleep_protocol_overrides WHERE date = ?",
            (date.today().isoformat(),)
        ).fetchone()
    
    bedtime = config["bedtime_hour"]
    wake = config["wake_hour"]
    enabled = bool(config["enabled"])
    
    # Determine if sunset protocol is active
    is_active = enabled and (hour >= bedtime or hour < wake) and not today_override
    
    # Calculate countdown to bedtime
    countdown_minutes = None
    if not is_active and enabled:
        if hour < bedtime:
            target = now.replace(hour=bedtime, minute=0, second=0)
            countdown_minutes = int((target - now).total_seconds() / 60)
    
    return {
        "enabled": enabled,
        "is_active": is_active,
        "bedtime_hour": bedtime,
        "wake_hour": wake,
        "current_hour": hour,
        "countdown_minutes": countdown_minutes,
        "overridden_today": bool(today_override),
        "override_reason": today_override["reason"] if today_override else None,
    }


@router.post("/configure")
def configure_protocol(data: ConfigInput):
    """Set bedtime hour, wake time, and lockout rules."""
    if not (0 <= data.bedtime_hour <= 23 and 0 <= data.wake_hour <= 23):
        return {"status": "error", "message": "Hours must be between 0 and 23"}
    
    with get_db_conn() as conn:
        conn.execute(
            """UPDATE sleep_protocol_config 
               SET bedtime_hour = ?, wake_hour = ?, updated_at = ? 
               WHERE id = 1""",
            (data.bedtime_hour, data.wake_hour, datetime.utcnow().isoformat())
        )
    
    return {
        "status": "success",
        "bedtime_hour": data.bedtime_hour,
        "wake_hour": data.wake_hour,
    }


class OverrideInput(BaseModel):
    reason: str


@router.post("/override")
def override_protocol(data: OverrideInput):
    """Emergency override with reason logging."""
    today_str = date.today().isoformat()
    now_iso = datetime.utcnow().isoformat()
    
    with get_db_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO sleep_protocol_overrides (date, reason, created_at) VALUES (?, ?, ?)",
            (today_str, data.reason, now_iso)
        )
    
    return {
        "status": "success",
        "date": today_str,
        "reason": data.reason,
        "message": "Protocol overridden for today. Use wisely."
    }


def _parse_range(range_str: str) -> int:
    mapping = {"7d": 7, "14d": 14, "30d": 30, "90d": 90, "180d": 180, "365d": 365}
    return mapping.get(range_str, 30)


@router.get("/compliance")
def get_compliance(range: str = "30d"):
    """Historical compliance data."""
    days = _parse_range(range)
    with get_db_conn() as conn:
        rows = conn.execute(
            """SELECT date, bedtime_target, actual_sleep_start, compliant, deviation_minutes
               FROM sleep_protocol_compliance
               WHERE date >= date('now', ? || ' days')
               ORDER BY date ASC""",
            (f"-{days}",)
        ).fetchall()
    
    data_points = []
    compliant_days = 0
    for r in rows:
        c = bool(r["compliant"])
        if c:
            compliant_days += 1
        data_points.append({
            "date": r["date"],
            "bedtime_target": r["bedtime_target"],
            "actual_sleep_start": r["actual_sleep_start"],
            "compliant": c,
            "deviation_minutes": r["deviation_minutes"],
        })
    
    return {
        "range": range,
        "data": data_points,
        "summary": {
            "total_days": len(data_points),
            "compliant_days": compliant_days,
            "compliance_pct": round((compliant_days / len(data_points)) * 100) if data_points else 0,
        }
    }
