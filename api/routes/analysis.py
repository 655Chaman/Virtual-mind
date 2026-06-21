from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from brain.analyzers.pattern_analyzer import get_latest_analysis, analyze_week, save_analysis

router = APIRouter()

class AnalyzeRequest(BaseModel):
    logs: List[Dict[str, Any]]

@router.get("/patterns/latest")
def get_latest():
    """Get the most recent weekly mirror analysis."""
    latest = get_latest_analysis()
    return latest

@router.post("/patterns/analyze")
def trigger_analysis(req: AnalyzeRequest):
    """Trigger a new weekly mirror analysis using Claude."""
    try:
        analysis = analyze_week(req.logs)
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
        save_analysis(analysis)
        return analysis
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
