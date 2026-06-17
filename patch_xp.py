import json
from pathlib import Path
from datetime import date

LOGS_DIR = Path("/Users/syedchamansha/.gemini/antigravity/worktrees/Virtual-mind/explore-elesium-architecture-features/data/logs")

def patch_xp_engine():
    file_path = "/Users/syedchamansha/.gemini/antigravity/worktrees/Virtual-mind/explore-elesium-architecture-features/brain/xp_engine.py"
    with open(file_path, "r") as f:
        content = f.read()
        
    replacement = """    for field in bonus_fields:
        if nonneg.get(field, False) and field in XP_BONUSES:
            xp_breakdown.append({"item": f"{field}_bonus", "xp": XP_BONUSES[field], "type": "bonus"})
            total_xp += XP_BONUSES[field]

    # AI Immense XP 
    ai_xp = log.get("ai_bonus_xp", 0)
    if ai_xp > 0:
        xp_breakdown.append({"item": "ai_task_completion_bonus", "xp": ai_xp, "type": "bonus"})
        total_xp += ai_xp"""
        
    content = content.replace("""    for field in bonus_fields:
        if nonneg.get(field, False) and field in XP_BONUSES:
            xp_breakdown.append({"item": f"{field}_bonus", "xp": XP_BONUSES[field], "type": "bonus"})
            total_xp += XP_BONUSES[field]""", replacement)
            
    with open(file_path, "w") as f:
        f.write(content)

patch_xp_engine()
