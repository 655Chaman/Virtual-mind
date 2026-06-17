"""
VIRTUAL MIND: XP ENGINE
VERSION: 1.0 — A.O.S. 2.0 GAMIFICATION CORE

Translates a daily log entry into:
  - XP earned (base + bonuses - penalties)
  - Active penalty mandates (push_up_mandate, phone_lockout, food_restriction, system_wipe)
  - Perks unlocked (Ice Veins, Concrete Sleep)
  - Protocol scores per A.O.S. sub-system

XP SCORING MATRIX (from APEX OMEGA SYSTEM 2.0):
  Base (per non-negotiable completed): +10 XP
  Salah on time (all 5):               +20 XP bonus
  Missed Salah:                        -30 XP + phone_lockout mandate
  Ice Bath completed:                  +15 XP (Pain Conditioning)
  Cold Shower:                         +5 XP
  Combat Training session:             +20 XP
  Microbursts (burpees/push-ups done): +10 XP
  App Lock kept ON:                    +10 XP (D.A.M.)
  Memorization session done:           +15 XP (Quran + Combos)
  Sleep on floor:                      +10 XP (Concrete Sleep Perk prerequisite)
  Fajr without alarm:                  +25 XP (Neuroplasticity Engine)
  SMT (Sunday Master Task) completed:  +50 XP
  SMT failed (Sunday):                 -100 XP + system_wipe_flag
  Training skipped:                    -20 XP + push_up_mandate (10 push-ups)
  No Sales (business day):             push_up_mandate flag
  No Clients:                          food_restriction flag
  Ramadan Mode active:                 2x MULTIPLIER on all XP
"""

import json
import os
from datetime import date, timedelta, datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
from brain.elesium_bridge import get_live_execution_metrics

PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOGS_DIR = PROJECT_ROOT / "data" / "logs"
XP_LOG_PATH = PROJECT_ROOT / "logs" / "xp_log.json"

# ─── XP CONSTANTS ──────────────────────────────────────────────────────────────

BASE_XP_PER_NONNEG = 10

XP_BONUSES = {
    "salah_5_on_time_bonus": 20,     # All 5 Salah completed on time
    "ice_bath": 15,                   # Pain Conditioning
    "cold_shower": 5,
    "combat_training": 20,            # O.C.I.
    "microbursts": 10,                # F.M.S. combat microbursts
    "app_lock_on": 10,                # D.A.M.
    "memorization_session": 15,       # Quran + Fight Combos
    "sleep_on_floor": 10,             # Concrete Sleep Perk
    "fajr_without_alarm": 25,         # Neuroplasticity Engine peak
    "smt_completed": 50,              # Sunday Master Task
}

XP_PENALTIES = {
    "missed_salah": -30,              # DDF breach
    "training_skipped": -20,          # FMS breach
    "smt_failed": -100,               # SMT system wipe equivalent
    "deep_work_skipped": -30,         # Missed execution in Elesium
    "reading_skipped": -10,           # Missed knowledge gathering
    "integrity_breach": -20,          # Soft breach: Claimed work, no activity detected
}

# Non-negotiables that map directly to base XP
BASE_NONNEG_FIELDS = [
    "salah_5",
    "quran_30min",
    "deep_work_4hr",
    "physical_training",
    "reading_1hr",
    "adhkar",
    "no_phone_before_8",
    "no_sugar",
]

# New A.O.S. habit fields (also give base XP if done)
AOS_HABIT_FIELDS = [
    "ice_bath",
    "cold_shower",
    "microbursts",
    "memorization_session",
    "app_lock_on",
    "sleep_on_floor",
    "combat_training",
    "fajr_without_alarm",
    "smt_completed",
]

# Streak-based perk unlock thresholds
PERK_UNLOCK_THRESHOLDS = {
    "Ice Veins": {
        "field": "ice_bath",
        "streak_required": 7,
        "description": "7-day Ice Bath streak — Cold is no longer your enemy",
    },
    "Concrete Sleep": {
        "field": "sleep_on_floor",
        "streak_required": 7,
        "description": "7-day Sleep-on-Floor streak — Comfort is no longer your master",
    },
    "Fajr Warrior": {
        "field": "fajr_without_alarm",
        "streak_required": 14,
        "description": "14-day Fajr without alarm — Your circadian rhythm now serves Allah",
    },
}


# ─── XP COMPUTATION ────────────────────────────────────────────────────────────

def compute_xp_from_log(log: Dict[str, Any], is_ramadan: bool = False) -> Dict[str, Any]:
    """
    Computes XP for a single daily log entry.
    Returns a detailed breakdown with penalties and mandates.
    """
    nonneg = log.get("non_negotiables", {})
    log_date_str = log.get("date", date.today().isoformat())

    xp_breakdown = []
    total_xp = 0
    penalties_active = []
    perks_earned = []

    # ── 1. Base XP from classic non-negotiables ──────────────────────────────
    for field in BASE_NONNEG_FIELDS:
        val = nonneg.get(field, False)
        if val:
            xp_breakdown.append({"item": field, "xp": BASE_XP_PER_NONNEG, "type": "base"})
            total_xp += BASE_XP_PER_NONNEG

    # ── 2. Base XP from A.O.S. habits ────────────────────────────────────────
    for field in AOS_HABIT_FIELDS:
        val = nonneg.get(field, False)
        if val:
            xp_breakdown.append({"item": field, "xp": BASE_XP_PER_NONNEG, "type": "base"})
            total_xp += BASE_XP_PER_NONNEG

    # ── 3. Bonus XP ───────────────────────────────────────────────────────────
    # Salah bonus — only if salah_5 is True (all 5 on time)
    if nonneg.get("salah_5", False):
        xp_breakdown.append({"item": "salah_on_time_bonus", "xp": XP_BONUSES["salah_5_on_time_bonus"], "type": "bonus"})
        total_xp += XP_BONUSES["salah_5_on_time_bonus"]

    # Bonus XP for A.O.S. specific habits
    bonus_fields = ["ice_bath", "cold_shower", "combat_training", "microbursts",
                    "app_lock_on", "memorization_session", "sleep_on_floor",
                    "fajr_without_alarm", "smt_completed"]
    for field in bonus_fields:
        if nonneg.get(field, False) and field in XP_BONUSES:
            xp_breakdown.append({"item": f"{field}_bonus", "xp": XP_BONUSES[field], "type": "bonus"})
            total_xp += XP_BONUSES[field]

    # AI Immense XP 
    ai_xp = log.get("ai_bonus_xp", 0)
    if ai_xp > 0:
        xp_breakdown.append({"item": "ai_task_completion_bonus", "xp": ai_xp, "type": "bonus"})
        total_xp += ai_xp

    # ── 4. Penalties ──────────────────────────────────────────────────────────
    # Missed Salah
    if not nonneg.get("salah_5", False):
        xp_breakdown.append({"item": "missed_salah_penalty", "xp": XP_PENALTIES["missed_salah"], "type": "penalty"})
        total_xp += XP_PENALTIES["missed_salah"]
        penalties_active.append("phone_lockout")

    # Training skipped
    if not nonneg.get("physical_training", False):
        xp_breakdown.append({"item": "training_skipped_penalty", "xp": XP_PENALTIES["training_skipped"], "type": "penalty"})
        total_xp += XP_PENALTIES["training_skipped"]
        penalties_active.append("push_up_mandate")

    # Deep Work skipped
    if not nonneg.get("deep_work_4hr", False):
        xp_breakdown.append({"item": "deep_work_skipped_penalty", "xp": XP_PENALTIES["deep_work_skipped"], "type": "penalty"})
        total_xp += XP_PENALTIES["deep_work_skipped"]
        penalties_active.append("screen_lockout_warning")

    # Reading skipped
    if not nonneg.get("reading_1hr", False):
        xp_breakdown.append({"item": "reading_skipped_penalty", "xp": XP_PENALTIES["reading_skipped"], "type": "penalty"})
        total_xp += XP_PENALTIES["reading_skipped"]

    # SMT failure (only evaluated on Sundays)
    try:
        log_date = date.fromisoformat(log_date_str)
        is_sunday = log_date.weekday() == 6
    except ValueError:
        is_sunday = False

    if is_sunday and not nonneg.get("smt_completed", False):
        xp_breakdown.append({"item": "smt_failed_penalty", "xp": XP_PENALTIES["smt_failed"], "type": "penalty"})
        total_xp += XP_PENALTIES["smt_failed"]
        penalties_active.append("system_wipe_warning")

    # No sales / No clients flags (from log metadata)
    if log.get("no_sales_today", False):
        penalties_active.append("push_up_mandate")
    if log.get("no_clients_today", False):
        penalties_active.append("food_restriction")

    # ── 5. Integrity Check (Elesium Pillar vs Reality) ───────────────────────
    # If Elesium is claimed, cross-reference the live_execution_data
    is_elesium_claimed = nonneg.get("deep_work_4hr", False)
    if is_elesium_claimed:
        live = get_live_execution_metrics()
        # If today is the day of the log and no recent activity detected in HQ
        # This is a 'Soft Breach' — alerting the operator to absolute honesty
        if live.get("is_connected") and not live.get("recent_outreach"):
            # Only apply if the log date is today
            if log_date_str == date.today().isoformat():
                 xp_breakdown.append({
                     "item": "integrity_breach_penalty", 
                     "xp": XP_PENALTIES["integrity_breach"], 
                     "type": "penalty",
                     "reason": "Elesium Pillar claimed, but no pipeline activity detected in HQ."
                 })
                 total_xp += XP_PENALTIES["integrity_breach"]
                 penalties_active.append("integrity_alert")

    # ── 6. Ramadan 2x Multiplier ─────────────────────────────────────────────
    if is_ramadan:
        total_xp = total_xp * 2
        xp_breakdown.append({"item": "ramadan_ultra_mode_2x", "xp": total_xp // 2, "type": "multiplier"})

    # ── 6. Perk checks (requires streak computation) ──────────────────────────
    perks_earned = check_perk_unlocks(log_date_str)

    return {
        "date": log_date_str,
        "total_xp": max(0, total_xp),  # XP floor at 0
        "raw_xp": total_xp,
        "breakdown": xp_breakdown,
        "penalties_active": list(set(penalties_active)),
        "perks_unlocked": perks_earned,
        "is_ramadan": is_ramadan,
    }


def compute_today_xp(is_ramadan: bool = False) -> Dict[str, Any]:
    """Computes XP for today's log entry."""
    today_str = date.today().isoformat()
    log_path = LOGS_DIR / f"{today_str}.json"

    if not log_path.exists():
        return {
            "date": today_str,
            "total_xp": 0,
            "raw_xp": 0,
            "breakdown": [],
            "penalties_active": ["no_log_filed"],
            "perks_unlocked": [],
            "is_ramadan": is_ramadan,
            "error": "No log filed for today",
        }

    try:
        with open(log_path, "r", encoding="utf-8") as f:
            log = json.load(f)
    except Exception as e:
        return {"error": f"Failed to read log: {e}", "total_xp": 0}

    return compute_xp_from_log(log, is_ramadan=is_ramadan)


def get_xp_history(days: int = 30) -> List[Dict[str, Any]]:
    """Returns XP data for the last N days."""
    today = date.today()
    history = []

    for i in range(days - 1, -1, -1):
        target_date = today - timedelta(days=i)
        date_str = target_date.isoformat()
        log_path = LOGS_DIR / f"{date_str}.json"

        if log_path.exists():
            try:
                with open(log_path, "r", encoding="utf-8") as f:
                    log = json.load(f)
                result = compute_xp_from_log(log)
                history.append({
                    "date": date_str,
                    "xp": result["total_xp"],
                    "penalties": len(result["penalties_active"]),
                    "perks": result["perks_unlocked"],
                })
            except Exception:
                history.append({"date": date_str, "xp": 0, "penalties": 0, "perks": []})
        else:
            history.append({"date": date_str, "xp": 0, "penalties": 0, "perks": []})

    return history


# ─── STREAK COMPUTATION FOR PERKS ─────────────────────────────────────────────

def compute_field_streak(field: str, end_date_str: str = None) -> int:
    """Computes how many consecutive days a specific habit field was completed."""
    if end_date_str is None:
        end_date_str = date.today().isoformat()

    try:
        end_date = date.fromisoformat(end_date_str)
    except ValueError:
        return 0

    streak = 0
    check_date = end_date

    while True:
        date_str = check_date.isoformat()
        log_path = LOGS_DIR / f"{date_str}.json"

        if not log_path.exists():
            # Allow today to be missing without breaking streak
            if check_date == end_date:
                check_date -= timedelta(days=1)
                continue
            break

        try:
            with open(log_path, "r", encoding="utf-8") as f:
                log = json.load(f)
            nonneg = log.get("non_negotiables", {})
            if nonneg.get(field, False):
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        except Exception:
            break

    return streak


def check_perk_unlocks(as_of_date: str = None) -> List[Dict[str, Any]]:
    """Checks which perks have been unlocked based on current streaks."""
    unlocked = []

    for perk_name, config in PERK_UNLOCK_THRESHOLDS.items():
        field = config["field"]
        required = config["streak_required"]
        current_streak = compute_field_streak(field, as_of_date)

        if current_streak >= required:
            unlocked.append({
                "name": perk_name,
                "description": config["description"],
                "streak": current_streak,
                "required": required,
            })

    return unlocked


def get_active_penalties(as_of_date: str = None) -> List[Dict[str, Any]]:
    """Returns all currently active penalty mandates based on today or given date."""
    if as_of_date is None:
        as_of_date = date.today().isoformat()

    log_path = LOGS_DIR / f"{as_of_date}.json"
    if not log_path.exists():
        return [{"type": "no_log_filed", "description": "No log filed — System Access Restricted", "severity": "critical"}]

    try:
        with open(log_path, "r", encoding="utf-8") as f:
            log = json.load(f)
    except Exception:
        return []

    result = compute_xp_from_log(log)
    penalties = result.get("penalties_active", [])

    PENALTY_DESCRIPTIONS = {
        "phone_lockout": {
            "type": "phone_lockout",
            "description": "Missed Salah → Phone Locked Until Next Salah",
            "severity": "high",
            "protocol": "DDF",
        },
        "push_up_mandate": {
            "type": "push_up_mandate",
            "description": "Training Skipped / No Sales → 50 Push-ups Mandatory Now",
            "severity": "moderate",
            "protocol": "FMS / BDP",
        },
        "food_restriction": {
            "type": "food_restriction",
            "description": "No Clients Acquired → Meal Restriction Active",
            "severity": "moderate",
            "protocol": "BDP",
        },
        "system_wipe_warning": {
            "type": "system_wipe_warning",
            "description": "Sunday Master Task FAILED → System Wipe Protocol Initiated",
            "severity": "critical",
            "protocol": "SMT",
        },
    }

    return [PENALTY_DESCRIPTIONS[p] for p in penalties if p in PENALTY_DESCRIPTIONS]
