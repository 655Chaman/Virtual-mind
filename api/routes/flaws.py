from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from brain.analyzers import flaw_tracker

router = APIRouter()

class FlawTriggerRequest(BaseModel):
    date: str
    flaw_ids: List[int]

@router.get("", response_model=List[Dict[str, Any]])
def get_flaws():
    """Returns all 12 flaws with their statistics."""
    return flaw_tracker.get_all_flaws_stats()

from brain.elesium_bridge import get_elesium_metrics

@router.get("/most-active", response_model=List[Dict[str, Any]])
def get_most_active_flaws():
    """Returns top flaws, injecting critical dynamic flaws if behavior demands it."""
    base_flaws = flaw_tracker.get_most_active_flaws(limit=3)
    
    # DYNAMIC FLAW INJECTION: Preparation-as-Progress
    metrics = get_elesium_metrics()
    emails = metrics.get("emails_sent_total", 0)
    
    # If 0 emails sent ever, or we can check last activity, we flag it.
    if emails == 0:
        critical_flaw = {
            "id": 1,
            "name": "🚨 CRITICAL: Preparation-as-Progress (0 Outbound)",
            "count": 999,
            "trend": "up"
        }
        # Insert at the top
        base_flaws.insert(0, critical_flaw)
        
    return base_flaws

@router.get("/heatmap", response_model=Dict[str, List[int]])
def get_flaw_heatmap():
    """Returns a 30-day heatmap: for each day, which flaws appeared."""
    return flaw_tracker.get_flaw_heatmap(days=30)

@router.post("/flaw-trigger")
def trigger_flaw(request: FlawTriggerRequest):
    """Adds flaws to a specific day's log."""
    success = flaw_tracker.log_flaw_triggers(request.date, request.flaw_ids)
    if not success:
        raise HTTPException(status_code=404, detail="Log file for the given date not found or invalid.")
    return {"success": True, "date": request.date, "flaw_ids_added": request.flaw_ids}
