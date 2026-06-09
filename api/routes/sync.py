from fastapi import APIRouter
import datetime
from pydantic import BaseModel
from typing import TypedDict
from brain.notion_sync import (
    sync_daily_logs_to_notion,
    sync_milestones_from_notion,
    pull_writing_as_context
)

router = APIRouter()

class SyncStatusObj(TypedDict):
    last_sync: str
    records_synced: int

status: SyncStatusObj = {
    "last_sync": "Never",
    "records_synced": 0
}

@router.post("/api/sync/notion")
def trigger_full_sync():
    """Triggers full sync in both directions."""
    sync_daily_logs_to_notion()
    sync_milestones_from_notion()
    pull_writing_as_context()
    
    status["last_sync"] = datetime.datetime.now().isoformat()
    status["records_synced"] += 1
    return {"status": "success", "message": "Notion synchronization completed."}

@router.get("/api/sync/status")
def get_sync_status():
    """Returns the last sync status."""
    return status
