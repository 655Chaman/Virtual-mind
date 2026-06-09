import json
import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

PROJECTS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects.json")

class KillRequest(BaseModel):
    post_mortem: str

def load_projects():
    if not os.path.exists(PROJECTS_FILE):
        return {"projects": []}
    with open(PROJECTS_FILE, "r") as f:
        return json.load(f)

def save_projects(data):
    with open(PROJECTS_FILE, "w") as f:
        json.dump(data, f, indent=4)

@router.get("/")
def get_projects():
    data = load_projects()
    now = datetime.now(timezone.utc)
    for p in data["projects"]:
        try:
            last_touched = datetime.fromisoformat(p["last_touched"].replace("Z", "+00:00"))
            days_idle = (now - last_touched).days
            p["days_idle"] = days_idle
            if days_idle >= 7 and p["status"] == "active":
                p["flagged_for_graveyard"] = True
            else:
                p["flagged_for_graveyard"] = False
        except Exception:
            p["days_idle"] = 0
            p["flagged_for_graveyard"] = False
    return data

@router.post("/{project_id}/touch")
def touch_project(project_id: str):
    data = load_projects()
    for p in data["projects"]:
        if p["id"] == project_id:
            p["last_touched"] = datetime.now(timezone.utc).isoformat()
            save_projects(data)
            return {"status": "success", "project": p}
    raise HTTPException(status_code=404, detail="Project not found")

@router.post("/{project_id}/kill")
def kill_project(project_id: str, req: KillRequest):
    data = load_projects()
    for p in data["projects"]:
        if p["id"] == project_id:
            if not req.post_mortem or len(req.post_mortem) < 10:
                raise HTTPException(status_code=400, detail="Post-mortem too short. Face the death of the idea.")
            p["status"] = "dead"
            p["post_mortem"] = req.post_mortem
            p["last_touched"] = datetime.now(timezone.utc).isoformat()
            save_projects(data)
            return {"status": "killed", "project": p}
    raise HTTPException(status_code=404, detail="Project not found")
