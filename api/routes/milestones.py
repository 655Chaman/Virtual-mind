import os
import sys
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

# Ensure project root is in path to import brain
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from brain.analyzers.milestone_tracker import MilestoneTracker

router = APIRouter()
tracker = MilestoneTracker()

class MilestoneUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

@router.get("/api/milestones")
def get_milestones():
    """Returns all milestones grouped by pillar, with computed fields"""
    tracker.data = tracker._load_data() 
    return tracker.get_all_milestones()

@router.patch("/api/milestone/{milestone_id}")
def update_milestone(milestone_id: str, update: MilestoneUpdate):
    """Update status, notes, completed_date"""
    tracker.data = tracker._load_data()
    success = tracker.update_milestone(milestone_id, status=update.status, notes=update.notes)
    if not success:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return {"status": "success", "message": "Milestone updated"}

@router.get("/api/milestones/summary")
def get_summary():
    """Returns total, done, in_progress, not_started, overdue counts by pillar"""
    tracker.data = tracker._load_data()
    return tracker.get_summary()

@router.get("/api/checkpoint/score")
def get_checkpoint_score():
    """Reads checkpoint questions and auto-scores them based on milestones."""
    tracker.data = tracker._load_data()
    return tracker.run_checkpoint_score()
