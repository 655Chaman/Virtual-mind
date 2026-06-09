"""
VIRTUAL MIND: A.O.S. PROTOCOL ENGINE
VERSION: 1.0 — APEX OMEGA SYSTEM 2.0

Defines and evaluates the 7 sub-protocols of the A.O.S. 2.0 system.
Each protocol has:
  - Required daily habits to be "Active"
  - Penalty conditions that mark it "Breached"
  - Perk milestones earned via streaks
  - A severity score for dashboard display

PROTOCOLS:
  FMS  — Frequency Maximization System 2.0
  DDF  — Divine Discipline Framework
  DAM  — Dopamine Annihilation Mode
  MSL  — Mental Supremacy Loop
  BDP  — Business Domination Protocol
  SMT  — Sunday Master Task
  NEP  — Neuroplasticity Engine
"""

import json
from pathlib import Path
from datetime import date, timedelta
from typing import Dict, Any, List

PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOGS_DIR = PROJECT_ROOT / "data" / "logs"

# ─── PROTOCOL DEFINITIONS ─────────────────────────────────────────────────────

AOS_PROTOCOLS: Dict[str, Dict[str, Any]] = {
    "FMS": {
        "code": "FMS",
        "name": "Frequency Maximization System 2.0",
        "emoji": "🔥",
        "tagline": "High-intensity. Time-optimized. Combat-ready.",
        "required_habits": ["physical_training", "microbursts"],
        "bonus_habits": ["ice_bath"],
        "breach_conditions": ["physical_training_missing"],
        "perks": [
            {
                "name": "Ice Veins",
                "habit": "ice_bath",
                "streak_days": 7,
                "description": "Cold is no longer your enemy",
            }
        ],
        "color": "vm-red",
    },
    "DDF": {
        "code": "DDF",
        "name": "Divine Discipline Framework",
        "emoji": "🌙",
        "tagline": "Prayer as weapon. Faith as armor.",
        "required_habits": ["salah_5", "quran_30min", "adhkar"],
        "bonus_habits": ["fajr_without_alarm"],
        "breach_conditions": ["salah_5_missing"],
        "perks": [
            {
                "name": "Fajr Warrior",
                "habit": "fajr_without_alarm",
                "streak_days": 14,
                "description": "Your circadian rhythm now serves Allah",
            }
        ],
        "ramadan_bonus": "2x XP when Ramadan mode is active",
        "color": "gold",
    },
    "DAM": {
        "code": "DAM",
        "name": "Dopamine Annihilation Mode",
        "emoji": "🔒",
        "tagline": "App Lock on. Phone controlled. Mind free.",
        "required_habits": ["app_lock_on", "no_phone_before_8", "no_sugar"],
        "bonus_habits": ["sleep_on_floor"],
        "breach_conditions": ["no_phone_before_8_missing"],
        "perks": [
            {
                "name": "Concrete Sleep",
                "habit": "sleep_on_floor",
                "streak_days": 7,
                "description": "Comfort is no longer your master",
            }
        ],
        "color": "vm-green",
    },
    "MSL": {
        "code": "MSL",
        "name": "Mental Supremacy Loop",
        "emoji": "🧠",
        "tagline": "Read. Listen. Visualize. Plan.",
        "required_habits": ["reading_1hr", "memorization_session"],
        "bonus_habits": [],
        "breach_conditions": ["reading_1hr_missing"],
        "perks": [],
        "color": "gold-bright",
    },
    "BDP": {
        "code": "BDP",
        "name": "Business Domination Protocol",
        "emoji": "📈",
        "tagline": "AI-driven. Automated. Relentless.",
        "required_habits": ["deep_work_4hr"],
        "bonus_habits": [],
        "breach_conditions": ["deep_work_4hr_missing", "no_sales_today", "no_clients_today"],
        "penalty_triggers": {
            "no_sales_today": "push_up_mandate",
            "no_clients_today": "food_restriction",
        },
        "perks": [],
        "color": "gold",
    },
    "SMT": {
        "code": "SMT",
        "name": "Sunday Master Task",
        "emoji": "☄️",
        "tagline": "One critical task. Failure = System Wipe.",
        "required_habits": ["smt_completed"],
        "bonus_habits": [],
        "breach_conditions": ["smt_failed_on_sunday"],
        "perks": [],
        "sunday_only": True,
        "color": "vm-red",
    },
    "NEP": {
        "code": "NEP",
        "name": "Neuroplasticity Engine",
        "emoji": "⚡",
        "tagline": "Cold. Memorize. Endure. Evolve.",
        "required_habits": ["cold_shower", "memorization_session"],
        "bonus_habits": ["fajr_without_alarm"],
        "breach_conditions": [],
        "perks": [
            {
                "name": "Ice Veins",
                "habit": "cold_shower",
                "streak_days": 21,
                "description": "21 days cold — neuroplasticity rewired",
            }
        ],
        "color": "gold-bright",
    },
}


# ─── STATUS EVALUATION ────────────────────────────────────────────────────────

def evaluate_protocol_status(
    protocol_code: str,
    nonneg: Dict[str, Any],
    log_date_str: str,
) -> Dict[str, Any]:
    """
    Evaluates a single protocol's status given today's non-negotiables.
    Returns: active / breached / partial / skipped
    """
    protocol = AOS_PROTOCOLS[protocol_code]
    required = protocol.get("required_habits", [])
    bonus = protocol.get("bonus_habits", [])

    # Sunday-only protocols
    try:
        log_date = date.fromisoformat(log_date_str)
        is_sunday = log_date.weekday() == 6
    except ValueError:
        is_sunday = False

    if protocol.get("sunday_only") and not is_sunday:
        return {
            "code": protocol_code,
            "name": protocol["name"],
            "emoji": protocol["emoji"],
            "status": "skipped",
            "status_label": "Not Today",
            "color": "text-text-dim",
            "completed_habits": [],
            "missing_habits": [],
            "bonus_completed": [],
        }

    completed = [h for h in required if nonneg.get(h, False)]
    missing = [h for h in required if not nonneg.get(h, False)]
    bonus_done = [h for h in bonus if nonneg.get(h, False)]

    if not required:
        status = "active"
    elif len(missing) == 0:
        status = "active"
    elif len(completed) == 0:
        status = "breached"
    else:
        status = "partial"

    STATUS_LABELS = {
        "active": "ACTIVE",
        "breached": "BREACHED",
        "partial": "PARTIAL",
        "skipped": "NOT TODAY",
    }

    STATUS_COLORS = {
        "active": "text-vm-green",
        "breached": "text-vm-red",
        "partial": "text-gold",
        "skipped": "text-text-dim",
    }

    return {
        "code": protocol_code,
        "name": protocol["name"],
        "emoji": protocol["emoji"],
        "tagline": protocol.get("tagline", ""),
        "status": status,
        "status_label": STATUS_LABELS[status],
        "color": STATUS_COLORS[status],
        "completed_habits": completed,
        "missing_habits": missing,
        "bonus_completed": bonus_done,
    }


def get_all_protocol_statuses(
    target_date: str = None,
    is_ramadan: bool = False,
) -> Dict[str, Any]:
    """
    Returns the live status of all 7 A.O.S. protocols for a given date.
    """
    if target_date is None:
        target_date = date.today().isoformat()

    log_path = LOGS_DIR / f"{target_date}.json"
    nonneg = {}

    if log_path.exists():
        try:
            with open(log_path, "r", encoding="utf-8") as f:
                log = json.load(f)
            nonneg = log.get("non_negotiables", {})
        except Exception:
            pass

    statuses = {}
    active_count = 0
    breached_count = 0

    for code in AOS_PROTOCOLS:
        result = evaluate_protocol_status(code, nonneg, target_date)
        statuses[code] = result
        if result["status"] == "active":
            active_count += 1
        elif result["status"] == "breached":
            breached_count += 1

    total_non_skipped = sum(
        1 for s in statuses.values() if s["status"] != "skipped"
    )

    aos_health = round((active_count / max(1, total_non_skipped)) * 100)

    return {
        "date": target_date,
        "protocols": statuses,
        "summary": {
            "active": active_count,
            "breached": breached_count,
            "partial": sum(1 for s in statuses.values() if s["status"] == "partial"),
            "skipped": sum(1 for s in statuses.values() if s["status"] == "skipped"),
            "aos_health_score": aos_health,
            "is_ramadan": is_ramadan,
        },
    }


def get_protocol_streaks() -> Dict[str, int]:
    """
    Computes how many consecutive days each protocol has been 'active'.
    Useful for protocol-level streaks on the dashboard.
    """
    streaks = {code: 0 for code in AOS_PROTOCOLS}
    today = date.today()

    for code in AOS_PROTOCOLS:
        protocol = AOS_PROTOCOLS[code]
        if protocol.get("sunday_only"):
            streaks[code] = 0  # SMT measured differently
            continue

        required = protocol.get("required_habits", [])
        if not required:
            continue

        streak = 0
        check_date = today

        while True:
            date_str = check_date.isoformat()
            log_path = LOGS_DIR / f"{date_str}.json"

            if not log_path.exists():
                if check_date == today:
                    check_date -= timedelta(days=1)
                    continue
                break

            try:
                with open(log_path, "r", encoding="utf-8") as f:
                    log = json.load(f)
                nonneg = log.get("non_negotiables", {})
                all_done = all(nonneg.get(h, False) for h in required)
                if all_done:
                    streak += 1
                    check_date -= timedelta(days=1)
                else:
                    break
            except Exception:
                break

        streaks[code] = streak

    return streaks
