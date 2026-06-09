"""
VIRTUAL MIND API: A.O.S. PROTOCOL ROUTES
VERSION: 1.0 — APEX OMEGA SYSTEM 2.0 Status Endpoints
"""

from fastapi import APIRouter, Query
from typing import Optional
from brain.aos_protocols import (
    get_all_protocol_statuses,
    get_protocol_streaks,
    AOS_PROTOCOLS,
)
from brain.xp_engine import check_perk_unlocks, get_active_penalties
from datetime import date

router = APIRouter()


@router.get("/status")
def get_aos_status(
    target_date: Optional[str] = Query(None),
    ramadan: bool = Query(False),
):
    """
    Returns live status of all 7 A.O.S. protocols.
    Each protocol is: active / breached / partial / skipped.
    Also returns an AOS health score (0-100%).
    """
    as_of = target_date or date.today().isoformat()
    return get_all_protocol_statuses(target_date=as_of, is_ramadan=ramadan)


@router.get("/protocols")
def list_protocols():
    """
    Returns static definitions of all 7 A.O.S. protocols.
    Useful for rendering protocol cards in the UI.
    """
    return {
        code: {
            "code": proto["code"],
            "name": proto["name"],
            "emoji": proto["emoji"],
            "tagline": proto.get("tagline", ""),
            "required_habits": proto.get("required_habits", []),
            "bonus_habits": proto.get("bonus_habits", []),
            "perks": proto.get("perks", []),
            "sunday_only": proto.get("sunday_only", False),
            "color": proto.get("color", "gold"),
        }
        for code, proto in AOS_PROTOCOLS.items()
    }


@router.get("/streaks")
def get_protocol_streaks_route():
    """
    Returns the consecutive active-day streak for each protocol.
    """
    streaks = get_protocol_streaks()
    return {
        "streaks": streaks,
        "best_protocol": max(streaks, key=streaks.get) if streaks else None,
    }


@router.get("/perks")
def get_perks_route(target_date: Optional[str] = Query(None)):
    """
    Returns all earned perks based on habit streaks.
    """
    as_of = target_date or date.today().isoformat()
    perks = check_perk_unlocks(as_of_date=as_of)
    return {
        "date": as_of,
        "total_perks_earned": len(perks),
        "perks": perks,
    }


@router.get("/penalties")
def get_penalties_route(target_date: Optional[str] = Query(None)):
    """
    Returns all active penalty mandates.
    push_up_mandate / phone_lockout / food_restriction / system_wipe_warning
    """
    as_of = target_date or date.today().isoformat()
    penalties = get_active_penalties(as_of_date=as_of)
    return {
        "date": as_of,
        "penalty_count": len(penalties),
        "penalties": penalties,
        "system_status": "COMPROMISED" if any(p["severity"] == "critical" for p in penalties) else "OPERATIONAL",
    }
