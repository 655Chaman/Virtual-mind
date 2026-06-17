"""
VIRTUAL MIND API: XP ROUTES
VERSION: 1.0 — A.O.S. 2.0 Gamification Endpoints

Exposes XP scoring, history, and active penalty data.
"""

from fastapi import APIRouter, Query
from typing import Optional
from brain.xp_engine import (
    compute_today_xp,
    get_xp_history,
    get_active_penalties,
    check_perk_unlocks,
    compute_xp_from_log,
)
import json
from pathlib import Path
from datetime import date

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
LOGS_DIR = PROJECT_ROOT / "data" / "logs"


@router.get("/today")
def get_today_xp(ramadan: bool = Query(False, description="Set true if Ramadan mode is active for 2x XP")):
    """
    Returns the XP earned today with full breakdown.
    Includes bonuses, penalties, and active mandates.
    """
    return compute_today_xp(is_ramadan=ramadan)


@router.get("/history")
def get_xp_history_route(days: int = Query(30, ge=1, le=90)):
    """
    Returns XP totals for the last N days.
    Useful for the XP chart on the dashboard.
    """
    return get_xp_history(days=days)


@router.get("/penalties/active")
def get_active_penalties_route(target_date: Optional[str] = Query(None)):
    """
    Returns currently active penalty mandates.
    - push_up_mandate: Training skipped or no sales
    - phone_lockout: Missed Salah
    - food_restriction: No clients acquired
    - system_wipe_warning: Sunday Master Task failed
    """
    as_of = target_date or date.today().isoformat()
    return {
        "date": as_of,
        "penalties": get_active_penalties(as_of_date=as_of),
    }


@router.get("/perks")
def get_perks_route(target_date: Optional[str] = Query(None)):
    """
    Returns all unlocked perks based on habit streaks.
    - Ice Veins: 7-day Ice Bath streak
    - Concrete Sleep: 7-day Sleep-on-Floor streak
    - Fajr Warrior: 14-day Fajr-without-alarm streak
    """
    as_of = target_date or date.today().isoformat()
    return {
        "date": as_of,
        "perks": check_perk_unlocks(as_of_date=as_of),
    }


@router.get("/score/{target_date}")
def get_xp_for_date(target_date: str, ramadan: bool = Query(False)):
    """
    Computes XP for a specific past date.
    """
    from api.db import get_sync_logs_collection
    try:
        col = get_sync_logs_collection()
        log = col.find_one({"date": target_date})
        if not log:
            return {
                "date": target_date,
                "total_xp": 0,
                "error": f"No log found for {target_date}",
            }
        return compute_xp_from_log(log, is_ramadan=ramadan)
    except Exception as e:
        return {"date": target_date, "total_xp": 0, "error": str(e)}


@router.get("/leaderboard")
def get_xp_leaderboard():
    """
    Returns top XP days — effectively your personal best days.
    Motivational reference for the command center.
    """
    history = get_xp_history(days=90)
    sorted_days = sorted(history, key=lambda x: x["xp"], reverse=True)
    return {
        "top_days": sorted_days[:10],
        "total_xp_all_time": sum(d["xp"] for d in history),
        "average_daily_xp": round(sum(d["xp"] for d in history if d["xp"] > 0) / max(1, len([d for d in history if d["xp"] > 0])), 1),
    }
