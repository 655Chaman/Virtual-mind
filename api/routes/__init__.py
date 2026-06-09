from fastapi import APIRouter
from pydantic import BaseModel

from api.routes.chat import router as chat_router
from api.routes.chat_history import router as chat_history_router

router = APIRouter()

# Attach API sub-routers
router.include_router(chat_router)
router.include_router(chat_history_router)

# Stubs restored from main.py implementation to maintain full spec
class DailyLog(BaseModel):
    pass

class FlawTrigger(BaseModel):
    flaw_id: str

class MilestoneUpdate(BaseModel):
    milestone_id: str
    status: str

@router.post("/log")
async def submit_daily_log(log: DailyLog):
    return {"status": "success", "message": "Log submitted (stub)"}

@router.get("/logs")
async def get_all_logs():
    return {"logs": []}

@router.get("/status")
async def get_status():
    return {"status": "Phase 0 active"}

@router.get("/patterns")
async def get_patterns():
    return {"patterns": []}

@router.get("/milestones")
async def get_milestones():
    return {"milestones": []}

@router.post("/milestone")
async def update_milestone(update: MilestoneUpdate):
    return {"status": "success", "message": "Milestone updated (stub)"}

@router.get("/flaws")
async def get_flaws():
    return {"flaws": []}

@router.post("/flaw-trigger")
async def log_flaw_trigger(trigger: FlawTrigger):
    return {"status": "success", "message": "Flaw logged (stub)"}
