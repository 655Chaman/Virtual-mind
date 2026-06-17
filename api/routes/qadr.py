import json
import os
from pathlib import Path
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
from api.database import get_db

router = APIRouter()

BANGALORE_TZ = timezone(timedelta(hours=5, minutes=30))

class AnswerInput(BaseModel):
    session_id: str
    question_id: str
    answer: str

class SelectScheduleInput(BaseModel):
    session_id: str
    schedule_id: str

class GenerateInput(BaseModel):
    session_id: str

def _get_tomorrow_date() -> str:
    now = datetime.now(BANGALORE_TZ)
    tomorrow = now + timedelta(days=1)
    return tomorrow.strftime("%Y-%m-%d")

def _get_tomorrow_day_name() -> str:
    now = datetime.now(BANGALORE_TZ)
    tomorrow = now + timedelta(days=1)
    return tomorrow.strftime("%A")

def _fetch_prayer_times_for_date(target_date: str) -> dict:
    db = get_db()
    try:
        cache = db.prayer_cache.find_one({"_id": target_date})
        if cache:
            return cache.get("data", {}).get("timings", {})
    except Exception:
        pass
    
    try:
        dt = datetime.strptime(target_date, "%Y-%m-%d")
        url = f"https://api.aladhan.com/v1/timingsByCity"
        params = {
            "city": "Bangalore",
            "country": "India",
            "method": 1,
            "school": 1,
            "date": dt.strftime("%d-%m-%Y"),
            "tune": "0,-2,-6,0,-1,5,0,0,0"
        }
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json().get("data", {})
            raw = data.get("timings", {})
            return {
                "Fajr": raw.get("Fajr", "05:00"),
                "Sunrise": raw.get("Sunrise", "06:00"),
                "Dhuhr": raw.get("Dhuhr", "12:30"),
                "Asr": raw.get("Asr", "15:45"),
                "Maghrib": raw.get("Maghrib", "18:30"),
                "Isha": raw.get("Isha", "19:45"),
            }
    except Exception as e:
        print(f"[QADR] Prayer fetch failed: {e}")
    
    return {
        "Fajr": "05:00", "Sunrise": "06:15", "Dhuhr": "12:30",
        "Asr": "15:45", "Maghrib": "18:30", "Isha": "19:45"
    }

def _get_today_completion() -> dict:
    today_str = date.today().isoformat()
    db = get_db()
    
    result = {
        "logged_today": False,
        "prayers_completed": 0,
        "non_negotiables_met": 0,
        "non_negotiables_total": 8,
        "missed_items": []
    }
    
    log = db.daily_logs.find_one({"date": today_str})
    if log:
        result["logged_today"] = True
        prayers = log.get("prayers_logged", {})
        result["prayers_completed"] = sum(1 for v in prayers.values() if v)
        
        nn = log.get("non_negotiables", {})
        met = sum(1 for v in nn.values() if v)
        result["non_negotiables_met"] = met
        result["non_negotiables_total"] = len(nn)
        
        missed = [k.replace("_", " ").title() for k, v in nn.items() if not v]
        result["missed_items"] = missed
    
    return result

def _get_streak_data() -> dict:
    return {"overall_streak": 0}

def _get_workout_status() -> dict:
    today = date.today()
    db = get_db()
    
    try:
        row = db.workouts.find_one({}, sort=[("date", -1)])
        if row:
            last = datetime.strptime(row["date"], "%Y-%m-%d").date()
            days_since = (today - last).days
            is_rest = days_since == 0
            return {
                "is_rest_day": is_rest,
                "last_workout": row["date"],
                "days_since_workout": days_since
            }
    except Exception:
        pass
    
    return {"is_rest_day": False, "last_workout": None, "days_since_workout": 0}

@router.get("/context")
async def get_tomorrow_context():
    target_date = _get_tomorrow_date()
    day_name = _get_tomorrow_day_name()
    is_friday = day_name == "Friday"
    
    prayer_times = _fetch_prayer_times_for_date(target_date)
    today_completion = _get_today_completion()
    streak = _get_streak_data()
    workout = _get_workout_status()
    
    context = {
        "target_date": target_date,
        "day_name": day_name,
        "is_friday": is_friday,
        "is_jummah": is_friday,
        "prayer_times": prayer_times,
        "today_completion": today_completion,
        "streak": streak,
        "workout_status": workout,
        "gathered_at": datetime.now(BANGALORE_TZ).isoformat(),
    }
    
    now_iso = datetime.now(BANGALORE_TZ).isoformat()
    today_str = date.today().isoformat()
    
    db = get_db()
    existing = db.qadr_sessions.find_one({"date": today_str}, sort=[("_id", -1)])
    
    if existing:
        session_id = str(existing["_id"])
        answers = existing.get("answers", {})
        
        old_context = existing.get("context", {})
        if "generated_questions" in old_context:
            context["generated_questions"] = old_context["generated_questions"]
        
        db.qadr_sessions.update_one(
            {"_id": existing["_id"]},
            {"$set": {"context": context, "updated_at": now_iso}}
        )
    else:
        context["generated_questions"] = []
        result = db.qadr_sessions.insert_one({
            "date": today_str,
            "target_date": target_date,
            "context": context,
            "answers": {},
            "status": "in_progress",
            "created_at": now_iso,
            "updated_at": now_iso
        })
        session_id = str(result.inserted_id)
        answers = {}
    
    return {
        "session_id": session_id,
        "context": context,
        "answers_so_far": answers,
    }

# ─────────────────────────────────────────────────────────────────────────────
# ADAPTIVE QUESTION ENGINE (Simplified)
# ─────────────────────────────────────────────────────────────────────────────

QUESTION_BANK = [
    {
        "id": "wake_time",
        "question": "What time do you want to wake up tomorrow?",
        "subtext": "Fajr is at {fajr_time}. Plan accordingly.",
        "type": "choice",
        "options": ["Before Fajr (4:30 AM)", "At Fajr ({fajr_time})", "After Fajr (6:00 AM)", "Custom"],
        "required": True,
        "category": "foundation",
    },
    {
        "id": "top_priority",
        "question": "What is the ONE thing that MUST happen tomorrow?",
        "subtext": "Not 3 things. Not 5. The ONE non-negotiable output.",
        "type": "text",
        "placeholder": "e.g., Film 3 carousel reels for Elesium",
        "required": True,
        "category": "business",
    },
    {
        "id": "workout_plan",
        "question": "Training tomorrow? What's the session?",
        "subtext": "{workout_context}",
        "type": "choice",
        "options": ["Push day", "Pull day", "Legs", "Full body", "Cardio only", "Rest day"],
        "required": True,
        "category": "body",
    },
    {
        "id": "sleep_target",
        "question": "What time will you sleep tomorrow night?",
        "subtext": "You're planning right now at {current_time}. Tomorrow's bedtime?",
        "type": "choice",
        "options": ["9:00 PM (optimal)", "9:30 PM", "10:00 PM", "10:30 PM (latest)"],
        "required": True,
        "category": "wellness",
    },
]

def _build_questions(context: dict, answers: dict) -> List[dict]:
    questions = list(QUESTION_BANK)
    prayer_times = context.get("prayer_times", {})
    workout = context.get("workout_status", {})
    fajr_time = prayer_times.get("Fajr", "05:00")
    workout_ctx = "Rest day recommended" if workout.get("is_rest_day") else "Training day"
    now = datetime.now(BANGALORE_TZ)
    current_time = now.strftime("%I:%M %p")
    
    template_vars = {
        "fajr_time": fajr_time,
        "workout_context": workout_ctx,
        "current_time": current_time,
    }
    
    resolved = []
    for q in questions:
        rq = dict(q)
        for field in ["question", "subtext"]:
            if rq.get(field):
                for key, val in template_vars.items():
                    rq[field] = rq[field].replace(f"{{{key}}}", val)
        if rq.get("options"):
            rq["options"] = [opt.replace("{fajr_time}", fajr_time) for opt in rq["options"]]
        resolved.append(rq)
    
    return resolved

def _get_next_question_fallback(answers: dict, context: dict) -> dict:
    questions = _build_questions(context, answers)
    
    next_q = None
    for q in questions:
        if q["id"] not in answers:
            next_q = q
            break
            
    progress = round(len(answers) / len(questions) * 100) if questions else 100
    
    if not next_q:
        return {
            "id": "complete",
            "question": "",
            "type": "text",
            "category": "logistics",
            "estimated_progress": 100,
            "complete": True
        }
        
    return {
        "id": next_q["id"],
        "question": next_q["question"],
        "subtext": next_q.get("subtext", ""),
        "type": next_q["type"],
        "options": next_q.get("options", []),
        "category": next_q.get("category", "logistics"),
        "estimated_progress": progress,
        "complete": False
    }

def _get_next_question_flow(answers: dict, context: dict) -> tuple:
    q_data = _get_next_question_fallback(answers, context)
    return q_data, q_data.get("complete", False), context

from bson.objectid import ObjectId

@router.post("/answer")
async def submit_answer(data: AnswerInput):
    db = get_db()
    session = db.qadr_sessions.find_one({"_id": ObjectId(data.session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    answers = session.get("answers", {})
    context = session.get("context", {})
    
    answers[data.question_id] = data.answer
    
    next_q, complete, updated_context = _get_next_question_flow(answers, context)
    
    db.qadr_sessions.update_one(
        {"_id": ObjectId(data.session_id)},
        {"$set": {
            "answers": answers, 
            "context": updated_context, 
            "updated_at": datetime.now(BANGALORE_TZ).isoformat()
        }}
    )
    
    answered_count = len(answers)
    progress = next_q["estimated_progress"] if next_q else 100
    
    return {
        "session_id": data.session_id,
        "answered": answered_count,
        "total": 4,
        "progress": progress,
        "next_question": next_q if not complete else None,
        "complete": complete,
    }

@router.get("/questions/{session_id}")
async def get_questions(session_id: str):
    db = get_db()
    session = db.qadr_sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    answers = session.get("answers", {})
    context = session.get("context", {})
    
    next_q, complete, updated_context = _get_next_question_flow(answers, context)
    progress = next_q["estimated_progress"] if next_q else 100
    
    return {
        "session_id": session_id,
        "questions": context.get("generated_questions", []),
        "answers": answers,
        "next_question": next_q if not complete else None,
        "progress": progress,
        "complete": complete,
    }

# ─────────────────────────────────────────────────────────────────────────────
# SCHEDULE GENERATOR
# ─────────────────────────────────────────────────────────────────────────────

def _generate_warrior_schedule(answers: dict, context: dict) -> dict:
    return {
        "mode": "warrior",
        "label": "⚔️ WARRIOR",
        "description": "Maximum output. Tight blocks. No buffer.",
        "blocks": [],
        "tomorrow_score": 90,
        "total_productive_hours": 8,
        "wake_time": "05:00",
        "sleep_time": "21:00",
    }

def _generate_king_schedule(answers: dict, context: dict) -> dict:
    return {
        "mode": "king",
        "label": "👑 KING",
        "description": "Strategic spacing. Recovery built in.",
        "blocks": [],
        "tomorrow_score": 85,
        "total_productive_hours": 6,
        "wake_time": "05:00",
        "sleep_time": "21:00",
    }

@router.post("/generate")
async def generate_schedules(data: GenerateInput):
    db = get_db()
    session = db.qadr_sessions.find_one({"_id": ObjectId(data.session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    answers = session.get("answers", {})
    context = session.get("context", {})
    
    warrior = _generate_warrior_schedule(answers, context)
    king = _generate_king_schedule(answers, context)
    now_iso = datetime.now(BANGALORE_TZ).isoformat()
    
    res_w = db.qadr_schedules.insert_one({
        "session_id": data.session_id,
        "mode": "warrior",
        "blocks": warrior["blocks"],
        "tomorrow_score": warrior["tomorrow_score"],
        "total_productive_hours": warrior["total_productive_hours"],
        "created_at": now_iso
    })
    warrior["schedule_id"] = str(res_w.inserted_id)
    
    res_k = db.qadr_schedules.insert_one({
        "session_id": data.session_id,
        "mode": "king",
        "blocks": king["blocks"],
        "tomorrow_score": king["tomorrow_score"],
        "total_productive_hours": king["total_productive_hours"],
        "created_at": now_iso
    })
    king["schedule_id"] = str(res_k.inserted_id)
    
    db.qadr_sessions.update_one(
        {"_id": ObjectId(data.session_id)},
        {"$set": {"status": "generated", "updated_at": now_iso}}
    )
    
    return {
        "session_id": data.session_id,
        "target_date": context.get("target_date"),
        "warrior": warrior,
        "king": king,
    }

@router.post("/select")
async def select_schedule(data: SelectScheduleInput):
    db = get_db()
    schedule = db.qadr_schedules.find_one({"_id": ObjectId(data.schedule_id)})
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    session = db.qadr_sessions.find_one({"_id": ObjectId(data.session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    target_date = session["target_date"]
    now_iso = datetime.now(BANGALORE_TZ).isoformat()
    
    db.qadr_selected.update_one(
        {"date": target_date},
        {"$set": {
            "schedule_id": data.schedule_id,
            "session_id": data.session_id,
            "mode": schedule["mode"],
            "created_at": now_iso
        }},
        upsert=True
    )
    
    db.qadr_sessions.update_one(
        {"_id": ObjectId(data.session_id)},
        {"$set": {"status": "selected", "updated_at": now_iso}}
    )
    
    return {
        "status": "locked_in",
        "date": target_date,
        "mode": schedule["mode"],
        "message": f"Tomorrow is set. {schedule['mode'].upper()} mode locked."
    }

@router.get("/active")
async def get_active_schedule():
    today_str = date.today().isoformat()
    db = get_db()
    
    selected = db.qadr_selected.find_one({"date": today_str})
    if not selected:
        return {"active": False, "message": "No schedule set for today."}
        
    schedule = db.qadr_schedules.find_one({"_id": ObjectId(selected["schedule_id"])})
    if not schedule:
        return {"active": False, "message": "Schedule data not found."}
    
    return {
        "active": True,
        "date": today_str,
        "mode": selected["mode"],
        "blocks": schedule.get("blocks", []),
        "tomorrow_score": schedule.get("tomorrow_score", 0),
        "total_productive_hours": schedule.get("total_productive_hours", 0),
        "completion_pct": selected.get("completion_pct", 0),
    }

@router.get("/history")
async def get_schedule_history(days: int = 14):
    db = get_db()
    selected_docs = list(db.qadr_selected.find().sort("date", -1).limit(days))
    
    res = []
    for s in selected_docs:
        schedule = db.qadr_schedules.find_one({"_id": ObjectId(s["schedule_id"])})
        res.append({
            "date": s["date"],
            "mode": s["mode"],
            "completion_pct": s.get("completion_pct", 0),
            "tomorrow_score": schedule.get("tomorrow_score", 0) if schedule else 0,
            "productive_hours": schedule.get("total_productive_hours", 0) if schedule else 0,
        })
    return res
