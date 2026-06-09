"""
VIRTUAL MIND: DAILY TRACKER
VERSION: 2.0 — THE SUPREME UPGRADE

Handles tracking of daily non-negotiables, streaks, and completion rates.
Data is stored locally in `logs/daily_tracker.json`.
"""

import os
import json
from datetime import date, timedelta
from brain.sheets_db import sheets_db

TRACKER_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs", "daily_tracker.json")

# Boolean items — Classic Non-Negotiables
BOOL_TRACKERS = {
    "salah": "salah_5_on_time",
    "quran": "quran_30min",
    "training": "physical_training",
    "reading": "reading_1hr",
    "adhkar": "adhkar",
    "phone": "no_phone_before_8",
    "sugar": "no_sugar",
    # ── A.O.S. 2.0 Protocol Habits ──────────────────────────
    "ice_bath": "ice_bath",                          # F.M.S. — Pain Conditioning
    "cold_shower": "cold_shower",                    # Neuroplasticity Engine
    "microbursts": "microbursts",                    # F.M.S. — Combat Microbursts
    "memorization": "memorization_session",          # M.S.L. — Quran + Fight Combos
    "app_lock": "app_lock_on",                       # D.A.M. — Dopamine Annihilation
    "floor_sleep": "sleep_on_floor",                 # D.A.M. — Concrete Sleep Perk
    "combat": "combat_training",                     # O.C.I. — Omega Combat Intelligence
    "fajr_alarm": "fajr_without_alarm",              # Neuroplasticity Engine Peak
    "smt": "smt_completed",                          # S.M.T. — Sunday Master Task
    "ramadan": "ramadan_mode_active",                # D.D.F. — Ramadan Ultra Mode (2x XP)
    "no_sales": "no_sales_today",                    # B.D.P. — Business penalty trigger
    "no_clients": "no_clients_today",                # B.D.P. — Food restriction trigger
}

# Numeric/String items
VALUE_TRACKERS = {
    "deep_work": "deep_work_hours",
    "fajr_time": "fajr_time",
    "xp": "xp_earned",                              # Total XP for the day
    "smt_task": "smt_task",                          # One critical SMT task description
    "combat_notes": "combat_strategy_notes",         # S.W.P. / O.C.I. strategy journal
}

class DailyTracker:
    def __init__(self, filepath=TRACKER_FILE):
        self.filepath = filepath
        self._ensure_file()

    def _ensure_file(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w") as f:
                json.dump({}, f)

    def load_data(self) -> dict:
        try:
            with open(self.filepath, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def save_data(self, data: dict):
        with open(self.filepath, "w") as f:
            json.dump(data, f, indent=2)
            
        # Extract the latest updated date
        if data:
            latest_date = list(data.keys())[-1] # Usually the one just appended
            # Use all possible trackers for headers
            all_keys = list(set(BOOL_TRACKERS.values()).union(VALUE_TRACKERS.values()))
            sheets_db.append_tracker_data(latest_date, data[latest_date], all_keys)

    def track(self, item: str, value: str, date_str: str = None) -> str:
        """
        Track an item for a specific date (defaults to today).
        Usage: track('deep_work', '4.5') or track('salah', 'yes')
        """
        if date_str is None:
            date_str = date.today().isoformat()

        data = self.load_data()
        if date_str not in data:
            data[date_str] = {}

        item = item.lower()
        value = value.lower()

        # Handle boolean metrics
        if item in BOOL_TRACKERS:
            bool_val = value in ["yes", "y", "true", "1", "done"]
            data[date_str][BOOL_TRACKERS[item]] = bool_val
            self.save_data(data)
            return f"✅ Logged {BOOL_TRACKERS[item]} = {bool_val} for {date_str}"

        # Handle numeric/string metrics
        if item in VALUE_TRACKERS:
            key = VALUE_TRACKERS[item]
            if item == "deep_work":
                try:
                    num_val = float(value.replace("h", "").replace("hrs", "").strip())
                    data[date_str][key] = num_val
                    self.save_data(data)
                    return f"✅ Logged {key} = {num_val}h for {date_str}"
                except ValueError:
                    return f"⚠️ Invalid value for deep_work: {value}. Use a number (e.g., 4 or 4.5)."
            else:
                data[date_str][key] = value
                self.save_data(data)
                return f"✅ Logged {key} = {value} for {date_str}"

        return f"⚠️ Unknown tracking item: '{item}'. Available items: {', '.join(list(BOOL_TRACKERS.keys()) + list(VALUE_TRACKERS.keys()))}"

    def get_streaks(self) -> dict:
        """Calculates current streaks for all boolean metrics."""
        data = self.load_data()
        streaks = {v: 0 for v in BOOL_TRACKERS.values()}
        
        current_date = date.today()

        for key in streaks.keys():
            streak = 0
            check_date = current_date
            
            # Allow skipping today if it's not logged yet without breaking streak
            date_str = check_date.isoformat()
            if date_str not in data or key not in data[date_str] or not data[date_str][key]:
                check_date -= timedelta(days=1)
                
            while True:
                date_str = check_date.isoformat()
                if date_str in data and data[date_str].get(key, False):
                    streak += 1
                    check_date -= timedelta(days=1)
                else:
                    break
            
            streaks[key] = streak
            
        return streaks

    def get_completion_rate(self, days: int = 7) -> float:
        """Calculate overall completion rate of non-negotiables over the last N days."""
        data = self.load_data()
        current_date = date.today()
        
        total_possible = days * len(BOOL_TRACKERS)
        total_completed = 0
        
        for i in range(days):
            date_str = (current_date - timedelta(days=i)).isoformat()
            if date_str in data:
                day_data = data[date_str]
                total_completed += sum(1 for k in BOOL_TRACKERS.values() if day_data.get(k, False))
                
        if total_possible == 0:
            return 0.0
        return (total_completed / total_possible) * 100

    def get_status_summary(self) -> str:
        """Returns a formatted string summary of tracking stats."""
        streaks = self.get_streaks()
        completion_7d = self.get_completion_rate(7)
        completion_30d = self.get_completion_rate(30)
        
        lines = []
        lines.append("📊 DAILY TRACKING SYSTEM")
        lines.append(f"   7-Day Completion: {completion_7d:.1f}%")
        lines.append(f"   30-Day Completion: {completion_30d:.1f}%")
        lines.append("\n🔥 CURRENT STREAKS:")
        
        # Sort streaks highest to lowest
        sorted_streaks = sorted(streaks.items(), key=lambda x: x[1], reverse=True)
        for name, streak in sorted_streaks:
            lines.append(f"   - {name.replace('_', ' ').title()}: {streak} days")
            
        return "\n".join(lines)

tracker = DailyTracker()
