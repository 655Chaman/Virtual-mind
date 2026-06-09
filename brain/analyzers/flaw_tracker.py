import json
from pathlib import Path
from datetime import date, timedelta
from typing import List, Dict, Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
LOGS_DIR = PROJECT_ROOT / "data" / "logs"

FLAWS = [
    {
        "id": 1, 
        "title": "Confuses preparation with progress", 
        "description": "Sharpening the sword but never swinging it. Building is safe, selling is not."
    },
    {
        "id": 2, 
        "title": "Terrified of being ordinary", 
        "description": "The thought of being average is unbearable. Avoids trying to avoid proof of being unexceptional."
    },
    {
        "id": 3, 
        "title": "Uses porn as an escape hatch", 
        "description": "Reaches for zero-performance escape when pressure builds."
    },
    {
        "id": 4, 
        "title": "Intellectualizes emotions instead of feeling them", 
        "description": "Processes pain through frameworks instead of sitting with it."
    },
    {
        "id": 5, 
        "title": "Treats girlfriend as a problem to optimize", 
        "description": "Sees the relationship as friction rather than a person to love."
    },
    {
        "id": 6, 
        "title": "Equates stillness with failure", 
        "description": "Cannot tell the difference between a plateau and a decline. Panics at both."
    },
    {
        "id": 7, 
        "title": "Projects confidence as a shield, alienating people", 
        "description": "Dismisses feedback as 'they don\\'t understand me'."
    },
    {
        "id": 8, 
        "title": "Has no coding knowledge but building a tech company", 
        "description": "100% dependent on AI for technical execution."
    },
    {
        "id": 9, 
        "title": "Binary thinker in a world of gradients", 
        "description": "Everything is either amazing or terrible, ignoring the gray zone."
    },
    {
        "id": 10, 
        "title": "Building toward invulnerability, not expansion", 
        "description": "Building an empire to avoid being hurt, not to truly grow."
    },
    {
        "id": 11, 
        "title": "Starts things with fire and abandons them with silence", 
        "description": "Ghosting own projects instead of finishing or killing them."
    },
    {
        "id": 12, 
        "title": "Hasn't reconciled the Alexander in him with the mission", 
        "description": "Torn between fast conquest and patient institution-building."
    }
]

def load_logs_in_range(start_date: date, end_date: date) -> List[Dict[str, Any]]:
    logs = []
    if not LOGS_DIR.exists():
        return logs

    current_date = start_date
    while current_date <= end_date:
        file_path = LOGS_DIR / f"{current_date.isoformat()}.json"
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    logs.append(json.load(f))
            except Exception:
                pass
        current_date += timedelta(days=1)
    
    return logs

def get_all_flaws_stats() -> List[Dict[str, Any]]:
    today = date.today()
    last_30_start = today - timedelta(days=30)
    last_7_start = today - timedelta(days=7)

    # We load all logs to get total count and last_triggered
    # but practically we can just load everything or iterate all files
    all_logs = []
    if LOGS_DIR.exists():
        for file_path in LOGS_DIR.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    all_logs.append(json.load(f))
            except Exception:
                continue

    # Sort logs by date to find last_triggered
    all_logs.sort(key=lambda x: x.get("date", ""), reverse=True)

    stats = []
    for flaw in FLAWS:
        flaw_id = flaw["id"]
        total = 0
        last_30 = 0
        last_7 = 0
        last_triggered = None

        for log in all_logs:
            log_date_str = log.get("date")
            if not log_date_str:
                continue
            
            try:
                log_date = date.fromisoformat(log_date_str)
            except ValueError:
                continue
            
            triggers = log.get("flaw_triggers", [])
            if flaw_id in triggers:
                total += 1
                if last_triggered is None:
                    last_triggered = log_date_str
                
                if log_date >= last_30_start:
                    last_30 += 1
                if log_date >= last_7_start:
                    last_7 += 1

        # Calculate simple trend based on last 7 days vs previous 7 days (days 8-14)
        prev_7_start = today - timedelta(days=14)
        prev_7_count = 0
        for log in all_logs:
            log_date_str = log.get("date")
            if not log_date_str:
                continue
            try:
                log_date = date.fromisoformat(log_date_str)
                if prev_7_start <= log_date < last_7_start:
                    if flaw_id in log.get("flaw_triggers", []):
                        prev_7_count += 1
            except ValueError:
                pass

        if last_7 > prev_7_count:
            trend = "worsening"
        elif last_7 < prev_7_count:
            trend = "improving"
        else:
            trend = "stable"

        stats.append({
            "id": flaw_id,
            "title": flaw["title"],
            "description": flaw["description"],
            "trigger_count_total": total,
            "trigger_count_last_30": last_30,
            "trigger_count_last_7": last_7,
            "last_triggered": last_triggered,
            "trend": trend
        })

    return stats

def get_most_active_flaws(limit: int = 3) -> List[Dict[str, Any]]:
    stats = get_all_flaws_stats()
    # Filter for actually active flaws
    active_stats = [s for s in stats if s.get("trigger_count_last_30", 0) > 0]
    # Sort by trigger_count_last_30 descending
    active_stats.sort(key=lambda x: x["trigger_count_last_30"], reverse=True)
    return active_stats[:limit]

def get_flaw_heatmap(days: int = 30) -> Dict[str, List[int]]:
    today = date.today()
    start_date = today - timedelta(days=days-1)
    
    logs = load_logs_in_range(start_date, today)
    heatmap = {}
    
    current_date = start_date
    while current_date <= today:
        date_str = current_date.isoformat()
        heatmap[date_str] = []
        current_date += timedelta(days=1)
        
    for log in logs:
        log_date = log.get("date")
        if log_date in heatmap:
            heatmap[log_date] = log.get("flaw_triggers", [])
            
    return heatmap

def log_flaw_triggers(target_date: str, flaw_ids: List[int]) -> bool:
    """Updates the flaw triggers for a given date in the DailyLog."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = LOGS_DIR / f"{target_date}.json"
    
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            return False
            
        existing_triggers = set(data.get("flaw_triggers", []))
        existing_triggers.update(flaw_ids)
        data["flaw_triggers"] = sorted(list(existing_triggers))
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    
    return False
