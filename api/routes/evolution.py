import os
from fastapi import APIRouter
from pydantic import BaseModel
from google import genai

evolution_router = APIRouter()

# In a production app, these would query the real DB.
# For now, we mock the state to demonstrate the logic.
mock_failure_streak = 2 
mock_failed_wagers = [
    {"task": "Deep Work", "time": "14:00", "day": "Thursday"},
    {"task": "Deep Work", "time": "14:30", "day": "Friday"}
]

@evolution_router.get("/api/evolution/tax-rate")
async def get_dynamic_tax_rate():
    """
    DYNAMIC TAXATION: The Economy of Effort.
    If the user fails wagers, the cost of screen time inflates.
    Base cost is 100 XP for 15 minutes.
    """
    base_cost = 100
    inflation_multiplier = 1.0
    
    if mock_failure_streak >= 3:
        inflation_multiplier = 2.5 # 250 XP
    elif mock_failure_streak == 2:
        inflation_multiplier = 1.5 # 150 XP
        
    current_cost = int(base_cost * inflation_multiplier)
    
    return {
        "status": "Recession" if inflation_multiplier > 1 else "Prosperity",
        "current_streak_fails": mock_failure_streak,
        "cost_per_15m": current_cost,
        "message": f"Screen time inflation is at {int((inflation_multiplier - 1) * 100)}% due to recent failures."
    }

@evolution_router.get("/api/evolution/shadow-analysis")
async def run_shadow_analysis():
    """
    THE SHADOW TRACKER:
    Uses Gemini to analyze the user's failed wagers and predict their breaking points.
    """
    try:
        client = genai.Client()
        
        prompt = f"""
        You are a psychological analyst for an accountability app.
        The user has a history of failing the following tasks:
        {mock_failed_wagers}
        
        Analyze this pattern. Identify the user's 'Shadow Self' (their specific weakness or breaking point).
        Write a short, harsh 2-sentence push notification to send them right before this time tomorrow to preemptively inject friction and wake them up.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        return {
            "shadow_pattern_detected": True,
            "prediction": "Failure likelihood spikes at 14:00 on weekdays.",
            "preemptive_warning": response.text.strip()
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
