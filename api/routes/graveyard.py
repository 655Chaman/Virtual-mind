from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.database import get_db

router = APIRouter()

class KillRequest(BaseModel):
    post_mortem: str

@router.get("/")
def get_projects():
    db = get_db()
    projects = list(db.projects.find({}, {"_id": 0}))
    now = datetime.now(timezone.utc)
    for p in projects:
        try:
            last_touched = datetime.fromisoformat(p["last_touched"].replace("Z", "+00:00"))
            days_idle = (now - last_touched).days
            p["days_idle"] = days_idle
            p["flagged_for_graveyard"] = (days_idle >= 7 and p.get("status") == "active")
        except Exception as e:
            import traceback
            traceback.print_exc()
            p["days_idle"] = 0
            p["flagged_for_graveyard"] = False
    return {"projects": projects}

@router.post("/{project_id}/touch")
def touch_project(project_id: str):
    db = get_db()
    result = db.projects.find_one_and_update(
        {"id": project_id},
        {"$set": {"last_touched": datetime.now(timezone.utc).isoformat()}},
        return_document=True
    )
    if result:
        result.pop("_id", None)
        return {"status": "success", "project": result}
    raise HTTPException(status_code=404, detail="Project not found")

@router.post("/{project_id}/kill")
def kill_project(project_id: str, req: KillRequest):
    if not req.post_mortem or len(req.post_mortem) < 10:
        raise HTTPException(status_code=400, detail="Post-mortem too short. Face the death of the idea.")
        
    db = get_db()
    result = db.projects.find_one_and_update(
        {"id": project_id},
        {"$set": {
            "status": "dead",
            "post_mortem": req.post_mortem,
            "last_touched": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True
    )
    if result:
        result.pop("_id", None)
        return {"status": "killed", "project": result}
    raise HTTPException(status_code=404, detail="Project not found")
