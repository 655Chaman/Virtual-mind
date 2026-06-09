"""
Qadr Protocol — AI Night Planner
Plan your night. Own your morning. Dominate the day.

Before sleep, the AI interviews you about tomorrow, gathers context automatically,
and generates 2 schedule variations (WARRIOR / KING) to choose from.
"""

import json
import os
import sqlite3
from pathlib import Path
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
QADR_DB = DATA_DIR / "qadr.db"
LOGS_DIR = DATA_DIR / "logs"

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────────────────────

def get_db():
    QADR_DB.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(QADR_DB))
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS qadr_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                target_date TEXT NOT NULL,
                answers_json TEXT DEFAULT '{}',
                context_json TEXT DEFAULT '{}',
                status TEXT DEFAULT 'in_progress',
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS qadr_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                mode TEXT NOT NULL,
                blocks_json TEXT NOT NULL,
                tomorrow_score INTEGER DEFAULT 0,
                total_productive_hours REAL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES qadr_sessions(id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS qadr_selected (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                schedule_id INTEGER NOT NULL,
                session_id INTEGER NOT NULL,
                mode TEXT NOT NULL,
                completed_blocks_json TEXT DEFAULT '[]',
                completion_pct REAL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (schedule_id) REFERENCES qadr_schedules(id),
                FOREIGN KEY (session_id) REFERENCES qadr_sessions(id)
            )
        """)

init_db()


# ─────────────────────────────────────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────────────────────────────────────

class AnswerInput(BaseModel):
    session_id: int
    question_id: str
    answer: str


class SelectScheduleInput(BaseModel):
    session_id: int
    schedule_id: int


class GenerateInput(BaseModel):
    session_id: int


# ─────────────────────────────────────────────────────────────────────────────
# CONTEXT ENGINE — Auto-pull tomorrow's intel
# ─────────────────────────────────────────────────────────────────────────────

BANGALORE_TZ = timezone(timedelta(hours=5, minutes=30))

def _get_tomorrow_date() -> str:
    now = datetime.now(BANGALORE_TZ)
    tomorrow = now + timedelta(days=1)
    return tomorrow.strftime("%Y-%m-%d")


def _get_tomorrow_day_name() -> str:
    now = datetime.now(BANGALORE_TZ)
    tomorrow = now + timedelta(days=1)
    return tomorrow.strftime("%A")


def _fetch_prayer_times_for_date(target_date: str) -> dict:
    """Fetch prayer times for a specific date from Aladhan API."""
    cache_file = DATA_DIR / "prayer_times.json"
    
    # Check cache first
    if cache_file.exists():
        try:
            cache = json.loads(cache_file.read_text())
            if target_date in cache:
                return cache[target_date].get("timings", {})
        except Exception:
            pass
    
    # Fetch from API
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
    
    # Fallback defaults
    return {
        "Fajr": "05:00", "Sunrise": "06:15", "Dhuhr": "12:30",
        "Asr": "15:45", "Maghrib": "18:30", "Isha": "19:45"
    }


def _get_today_completion() -> dict:
    """Check what was completed today from logs."""
    today_str = date.today().isoformat()
    log_path = LOGS_DIR / f"{today_str}.json"
    
    result = {
        "logged_today": False,
        "prayers_completed": 0,
        "non_negotiables_met": 0,
        "non_negotiables_total": 8,
        "missed_items": []
    }
    
    if log_path.exists():
        try:
            data = json.loads(log_path.read_text())
            result["logged_today"] = True
            
            # Prayer count
            prayers = data.get("prayers_logged", {})
            result["prayers_completed"] = sum(1 for v in prayers.values() if v)
            
            # Non-negotiables
            nn = data.get("non_negotiables", {})
            met = sum(1 for v in nn.values() if v)
            result["non_negotiables_met"] = met
            result["non_negotiables_total"] = len(nn)
            
            missed = [k.replace("_", " ").title() for k, v in nn.items() if not v]
            result["missed_items"] = missed
        except Exception:
            pass
    
    return result


def _get_streak_data() -> dict:
    """Get current streak info."""
    try:
        from api.routes.logs import _compute_streak
        streak = _compute_streak()
        return {"overall_streak": streak.get("overall_streak", 0)}
    except Exception:
        return {"overall_streak": 0}


def _get_workout_status() -> dict:
    """Check if tomorrow is a rest day based on recent workout pattern."""
    today = date.today()
    workout_db = DATA_DIR / "workout.db"
    
    if not workout_db.exists():
        return {"is_rest_day": False, "last_workout": None, "days_since_workout": 0}
    
    try:
        conn = sqlite3.connect(str(workout_db))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT date FROM workout_logs ORDER BY date DESC LIMIT 1"
        )
        row = cursor.fetchone()
        conn.close()
        
        if row:
            last = datetime.strptime(row["date"], "%Y-%m-%d").date()
            days_since = (today - last).days
            # Simple heuristic: if trained 2+ consecutive days, suggest rest
            is_rest = days_since == 0  # trained today, tomorrow could be rest
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
    """
    Gathers all available intel about tomorrow BEFORE asking questions.
    This is the context engine — the AI arrives already informed.
    """
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
    
    # Create or get today's session
    now_iso = datetime.now(BANGALORE_TZ).isoformat()
    today_str = date.today().isoformat()
    
    with get_db() as conn:
        # Check for existing session today
        existing = conn.execute(
            "SELECT id, answers_json, context_json FROM qadr_sessions WHERE date = ? ORDER BY id DESC LIMIT 1",
            (today_str,)
        ).fetchone()
        
        if existing:
            session_id = existing["id"]
            answers = json.loads(existing["answers_json"] or "{}")
            
            # Preserve generated questions to avoid losing them on reload
            if existing["context_json"]:
                try:
                    old_context = json.loads(existing["context_json"])
                    if "generated_questions" in old_context:
                        context["generated_questions"] = old_context["generated_questions"]
                except Exception:
                    pass
            
            # Update context
            conn.execute(
                "UPDATE qadr_sessions SET context_json = ?, updated_at = ? WHERE id = ?",
                (json.dumps(context), now_iso, session_id)
            )
        else:
            context["generated_questions"] = []
            cursor = conn.execute(
                """INSERT INTO qadr_sessions (date, target_date, context_json, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?)""",
                (today_str, target_date, json.dumps(context), now_iso, now_iso)
            )
            session_id = cursor.lastrowid
            answers = {}
    
    return {
        "session_id": session_id,
        "context": context,
        "answers_so_far": answers,
    }


# ─────────────────────────────────────────────────────────────────────────────
# ADAPTIVE QUESTION ENGINE
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
        "id": "energy_level",
        "question": "How's your energy right now? Be honest.",
        "subtext": "This helps calibrate tomorrow's intensity.",
        "type": "choice",
        "options": ["Exhausted — barely surviving", "Low — need a lighter day", "Normal — steady state", "Charged — ready to destroy"],
        "required": True,
        "category": "calibration",
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
        "id": "content_plan",
        "question": "Content creation plan for tomorrow — be specific.",
        "subtext": "How many carousels? Reels? Stories? What topics/hooks?",
        "type": "text",
        "placeholder": "e.g., 2 carousels (hook: ...), 5 stories, 1 reel",
        "required": True,
        "category": "business",
    },
    {
        "id": "meetings_commitments",
        "question": "Any meetings, calls, or fixed commitments tomorrow?",
        "subtext": "Include exact times. If none, say 'clear'.",
        "type": "text",
        "placeholder": "e.g., Client call at 2 PM (30 min), Dentist at 4 PM",
        "required": True,
        "category": "logistics",
    },
    {
        "id": "workout_plan",
        "question": "Training tomorrow? What's the session?",
        "subtext": "{workout_context}",
        "type": "choice",
        "options": ["Push day (Chest/Shoulders/Tris)", "Pull day (Back/Biceps)", "Legs", "Full body", "Cardio only", "Rest day", "Custom"],
        "required": True,
        "category": "body",
    },
    {
        "id": "deep_work_hours",
        "question": "How many hours of uninterrupted deep work can you commit to?",
        "subtext": "Be realistic. Yesterday you {deep_work_context}.",
        "type": "choice",
        "options": ["2 hours", "3 hours", "4 hours (target)", "5+ hours (beast mode)"],
        "required": True,
        "category": "business",
    },
    {
        "id": "quran_goal",
        "question": "Quran goal for tomorrow?",
        "subtext": "Current streak: {streak_count} days. Keep it going.",
        "type": "choice",
        "options": ["1 page minimum", "5 pages", "10 pages", "1 Juz (20 pages)", "Custom"],
        "required": True,
        "category": "deen",
    },
    {
        "id": "avoid_list",
        "question": "What do you need to AVOID tomorrow?",
        "subtext": "{missed_context}",
        "type": "text",
        "placeholder": "e.g., No phone before 8 AM, no sugar, no YouTube",
        "required": False,
        "category": "self",
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

# Additional questions for Jummah (Friday)
JUMMAH_QUESTIONS = [
    {
        "id": "jummah_prep",
        "question": "Jummah Mubarak tomorrow! What's your prep plan?",
        "subtext": "Ghusl, early arrival, Surah Al-Kahf — how much are you committing?",
        "type": "choice",
        "options": [
            "Full prep (Ghusl + Surah Kahf + early Jummah)",
            "Standard (Ghusl + Jummah on time)",
            "Minimal (just Jummah prayer)"
        ],
        "required": True,
        "category": "deen",
        "insert_after": "quran_goal",
    }
]


def _build_questions(context: dict, answers: dict) -> List[dict]:
    """Build the adaptive question list based on context and answers so far."""
    questions = list(QUESTION_BANK)
    
    # Insert Jummah question if tomorrow is Friday
    if context.get("is_friday"):
        insert_idx = next(
            (i + 1 for i, q in enumerate(questions) if q["id"] == "quran_goal"),
            len(questions)
        )
        for jq in JUMMAH_QUESTIONS:
            questions.insert(insert_idx, jq)
    
    # Resolve template variables in questions
    prayer_times = context.get("prayer_times", {})
    today_comp = context.get("today_completion", {})
    streak = context.get("streak", {})
    workout = context.get("workout_status", {})
    
    fajr_time = prayer_times.get("Fajr", "05:00")
    streak_count = streak.get("overall_streak", 0)
    missed = today_comp.get("missed_items", [])
    missed_str = ", ".join(missed[:3]) if missed else "nothing — clean day"
    
    workout_ctx = "Rest day recommended" if workout.get("is_rest_day") else "Training day"
    deep_work_ctx = f"missed {len(missed)} non-negotiables" if missed else "hit all targets"
    
    now = datetime.now(BANGALORE_TZ)
    current_time = now.strftime("%I:%M %p")
    
    template_vars = {
        "fajr_time": fajr_time,
        "streak_count": str(streak_count),
        "missed_context": f"Today you missed: {missed_str}. Don't repeat." if missed else "Clean day today. Keep it going.",
        "workout_context": workout_ctx,
        "deep_work_context": deep_work_ctx,
        "current_time": current_time,
    }
    
    resolved = []
    for q in questions:
        rq = dict(q)
        # Resolve template strings
        for field in ["question", "subtext"]:
            if rq.get(field):
                for key, val in template_vars.items():
                    rq[field] = rq[field].replace(f"{{{key}}}", val)
        
        # Resolve option templates
        if rq.get("options"):
            rq["options"] = [
                opt.replace("{fajr_time}", fajr_time) for opt in rq["options"]
            ]
        
        resolved.append(rq)
    
    return resolved


def _get_next_question(questions: List[dict], answers: dict) -> Optional[dict]:
    """Get the next unanswered question."""
    for q in questions:
        if q["id"] not in answers:
            return q
    return None


def _generate_next_question_llm(answers: dict, context: dict, api_key: str) -> dict:
    """
    Dynamically generates the next interview question using Meta Llama 3.1 70B via the NVIDIA API.
    """
    history_str = ""
    if answers:
        generated_questions = context.get("generated_questions", [])
        q_mapping = {q["id"]: q["question"] for q in generated_questions}
        for idx, (q_id, ans) in enumerate(answers.items(), 1):
            q_text = q_mapping.get(q_id, q_id)
            history_str += f"Q{idx} ({q_text}): User answered '{ans}'\n"
    else:
        history_str = "No questions asked yet. This is the start of the interview."

    prompt = f"""
You are the Qadr Protocol AI, an elite daily performance coach. Your job is to conduct a highly personalized, deep evening interview with the user to prep their schedule for tomorrow.

Tomorrow's non-negotiables:
- GOD (Deen) is non-negotiable (Salah, Quran, Jummah).
- BUSINESS (Content / Elesium) is non-negotiable (Carousels, reels, stories).
- Health & Wellness (Workouts, sleep, focus).

You arrive with full context about today's accomplishments/misses, streaks, workout recovery, and tomorrow's prayer times.

YOUR TASK:
Generate the next question to ask the user. You must ask exactly ONE question.
Analyze the context and all previous questions and answers. Guide the user through calibrating their next day.
Pillars to cover before completing the interview:
1. Foundation: Bedtime/Wake time calibrating with Fajr.
2. Deen: Salah dedication, Quran reading target.
3. Business & Content: Specific plans for Elesium content (hooks, carousel counts, reels).
4. Logistics & Workouts: Workout plans, fixed commitments/meetings.
5. Wellness & Self-improvement: What to avoid, how to maintain focus.

Rules:
- Be direct, coaching, and rigorous. Do NOT ask generic questions.
- Ask progressively deeper questions to unpack the user's inner psychology, flaws, writings, and true nature. Probe into "what type of a being" they are based on their answers.
- If they said they want to do content, ask them specifically for hooks, quantities, or platforms.
- If they missed a prayer today, push them to lock in their salah blocks tomorrow.
- If they have a high streak, motivate them to protect it.
- Keep the number of questions between 10 and 15. The goal is a deep, psychological, and tactical interview. When you have gathered enough high-fidelity details to plan both a WARRIOR (beast-mode) and KING (balanced) schedule, set "complete" to true.
- If answers have reached 12 or more questions, you must set "complete" to true on the next turn.

Output MUST be a valid JSON object matching this schema exactly:
{{
  "id": "a_short_snake_case_id_for_this_question",
  "question": "Clear, deep, direct question text",
  "subtext": "Brief explanation or context referencing today's performance, tomorrow's prayers, or previous answers to keep them focused.",
  "type": "choice" or "text",
  "options": ["Option A", "Option B", "Option C"] (only if type is 'choice', otherwise empty list),
  "category": "foundation" or "deen" or "business" or "body" or "self" or "wellness" or "logistics",
  "estimated_progress": 0 to 100,
  "complete": true or false
}}

Context:
{json.dumps(context, indent=2)}

Interview History So Far:
{history_str}
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "mistralai/mistral-large-3-675b-instruct-2512",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 1024,
        "response_format": {"type": "json_object"}
    }
    
    resp = requests.post("https://integrate.api.nvidia.com/v1/chat/completions", headers=headers, json=payload, timeout=4)
    resp.raise_for_status()
    
    content = resp.json()["choices"][0]["message"]["content"]
    cleaned_content = content.strip()
    if cleaned_content.startswith("```"):
        lines = cleaned_content.splitlines()
        if lines[0].startswith("```json"):
            cleaned_content = "\n".join(lines[1:-1])
        else:
            cleaned_content = "\n".join(lines[1:-1])
            
    data = json.loads(cleaned_content)
    return data


def _get_next_question_fallback(answers: dict, context: dict) -> dict:
    """Fallback to static template questions if LLM fails or API key is missing."""
    questions = _build_questions(context, answers)
    next_q = _get_next_question(questions, answers)
    
    answered_count = len(answers)
    total_count = len(questions)
    progress = round(answered_count / total_count * 100) if total_count > 0 else 100
    
    if not next_q:
        return {
            "id": "complete",
            "question": "",
            "subtext": "",
            "type": "text",
            "options": [],
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
    """
    Decides the next question dynamically.
    Stores dynamic question history inside context["generated_questions"].
    Returns (next_question_dict, complete_boolean, updated_context_dict)
    """
    generated_questions = context.get("generated_questions", [])
    
    # 1. Search for any question in history that has not been answered yet
    for q in generated_questions:
        if q["id"] not in answers:
            return q, False, context
            
    # 2. Check if we should complete (Hard limit of 10 questions to prevent infinite loops)
    if len(answers) >= 10:
        return None, True, context
        
    # 3. Generate a new question
    import os
    nvidia_key = os.getenv("NVIDIA_API_KEY", "")
    
    q_data = None
    if nvidia_key and nvidia_key != "your_nvidia_api_key_here":
        try:
            print("[QADR] Calling NVIDIA API for dynamic next question...")
            q_data = _generate_next_question_llm(answers, context, nvidia_key)
            print(f"[QADR] Successfully generated dynamic question: {q_data.get('id')}")
        except Exception as e:
            print(f"[QADR] Dynamic question generation failed: {e}. Falling back to templates.")
            
    # Fallback if LLM failed
    if not q_data:
        q_data = _get_next_question_fallback(answers, context)
        
    # If session is complete
    if q_data.get("complete", False):
        return None, True, context
        
    # Ensure ID is unique and valid
    q_id = q_data.get("id")
    if not q_id or q_id in answers:
        q_id = f"q_gen_{len(generated_questions) + 1}"
        q_data["id"] = q_id
        
    # Append the new question to history
    generated_questions.append(q_data)
    context["generated_questions"] = generated_questions
    
    return q_data, False, context


@router.post("/answer")
async def submit_answer(data: AnswerInput):
    """
    Submit an answer and receive the next dynamic question.
    """
    with get_db() as conn:
        session = conn.execute(
            "SELECT * FROM qadr_sessions WHERE id = ?", (data.session_id,)
        ).fetchone()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        answers = json.loads(session["answers_json"] or "{}")
        context = json.loads(session["context_json"] or "{}")
        
        # Store the answer
        answers[data.question_id] = data.answer
        
        # Determine next question dynamically
        next_q, complete, updated_context = _get_next_question_flow(answers, context)
        
        conn.execute(
            "UPDATE qadr_sessions SET answers_json = ?, context_json = ?, updated_at = ? WHERE id = ?",
            (json.dumps(answers), json.dumps(updated_context), datetime.now(BANGALORE_TZ).isoformat(), data.session_id)
        )
    
    answered_count = len(answers)
    progress = next_q["estimated_progress"] if next_q else 100
    
    return {
        "session_id": data.session_id,
        "answered": answered_count,
        "total": 8,
        "progress": progress,
        "next_question": next_q if not complete else None,
        "complete": complete,
    }


@router.get("/questions/{session_id}")
async def get_questions(session_id: int):
    """Get all questions generated so far, and the next dynamic question."""
    with get_db() as conn:
        session = conn.execute(
            "SELECT * FROM qadr_sessions WHERE id = ?", (session_id,)
        ).fetchone()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        answers = json.loads(session["answers_json"] or "{}")
        context = json.loads(session["context_json"] or "{}")
        
        # Determine next question dynamically
        next_q, complete, updated_context = _get_next_question_flow(answers, context)
        
        conn.execute(
            "UPDATE qadr_sessions SET context_json = ?, updated_at = ? WHERE id = ?",
            (json.dumps(updated_context), datetime.now(BANGALORE_TZ).isoformat(), session_id)
        )
    
    generated_questions = updated_context.get("generated_questions", [])
    progress = next_q["estimated_progress"] if next_q else 100
    
    return {
        "session_id": session_id,
        "questions": generated_questions,
        "answers": answers,
        "next_question": next_q if not complete else None,
        "progress": progress,
        "complete": complete,
    }


# ─────────────────────────────────────────────────────────────────────────────
# SCHEDULE GENERATOR
# ─────────────────────────────────────────────────────────────────────────────

PILLAR_ICONS = {
    "deen": "☪️",
    "business": "⚡",
    "fitness": "🏋️",
    "wellness": "💧",
    "self": "🧠",
    "logistics": "📋",
    "rest": "😴",
    "food": "🍽️",
}


def _parse_time(t: str) -> datetime:
    """Parse HH:MM string to datetime for comparison."""
    parts = t.replace(" (IST)", "").strip().split(":")
    return datetime(2000, 1, 1, int(parts[0]), int(parts[1]))


def _format_block(start: str, end: str, activity: str, pillar: str, priority: str = "normal") -> dict:
    return {
        "start": start,
        "end": end,
        "activity": activity,
        "pillar": pillar,
        "icon": PILLAR_ICONS.get(pillar, "📌"),
        "priority": priority,
        "duration_min": _time_diff_minutes(start, end),
    }


def _time_diff_minutes(start: str, end: str) -> int:
    """Calculate minutes between two HH:MM strings."""
    try:
        s = _parse_time(start)
        e = _parse_time(end)
        diff = (e - s).total_seconds() / 60
        return max(0, int(diff))
    except Exception:
        return 60


def _add_minutes(time_str: str, minutes: int) -> str:
    """Add minutes to a HH:MM string."""
    try:
        t = _parse_time(time_str)
        result = t + timedelta(minutes=minutes)
        return result.strftime("%H:%M")
    except Exception:
        return time_str


def _generate_warrior_schedule(answers: dict, context: dict) -> dict:
    """Generate aggressive, max-output schedule."""
    prayer = context.get("prayer_times", {})
    fajr = prayer.get("Fajr", "05:00").replace(" (IST)", "").strip()
    dhuhr = prayer.get("Dhuhr", "12:30").replace(" (IST)", "").strip()
    asr = prayer.get("Asr", "15:45").replace(" (IST)", "").strip()
    maghrib = prayer.get("Maghrib", "18:30").replace(" (IST)", "").strip()
    isha = prayer.get("Isha", "19:45").replace(" (IST)", "").strip()
    
    # Determine wake time
    wake_answer = answers.get("wake_time", "")
    if "Before Fajr" in wake_answer or "4:30" in wake_answer:
        wake = "04:30"
    elif "After Fajr" in wake_answer or "6:00" in wake_answer:
        wake = "06:00"
    else:
        wake = fajr
    
    # Determine workout
    workout = answers.get("workout_plan", "Rest day")
    is_rest = "rest" in workout.lower()
    
    # Determine deep work hours
    dw = answers.get("deep_work_hours", "4 hours")
    dw_hours = 4
    if "2" in dw:
        dw_hours = 2
    elif "3" in dw:
        dw_hours = 3
    elif "5" in dw:
        dw_hours = 5
    
    # Determine sleep time
    sleep_answer = answers.get("sleep_target", "9:00 PM")
    if "9:30" in sleep_answer:
        sleep_time = "21:30"
    elif "10:00" in sleep_answer:
        sleep_time = "22:00"
    elif "10:30" in sleep_answer:
        sleep_time = "22:30"
    else:
        sleep_time = "21:00"
    
    blocks = []
    
    # === MORNING BLOCK ===
    if wake < fajr:
        blocks.append(_format_block(wake, fajr, "Tahajjud / Quran / Adhkar", "deen", "high"))
    
    blocks.append(_format_block(fajr, _add_minutes(fajr, 15), "Fajr Salah", "deen", "critical"))
    blocks.append(_format_block(_add_minutes(fajr, 15), _add_minutes(fajr, 45), "Quran + Morning Adhkar", "deen", "high"))
    
    if not is_rest:
        blocks.append(_format_block(_add_minutes(fajr, 45), _add_minutes(fajr, 135), f"🔥 {workout}", "fitness", "high"))
        blocks.append(_format_block(_add_minutes(fajr, 135), _add_minutes(fajr, 150), "Shower + Fuel", "wellness", "normal"))
        deep_start = _add_minutes(fajr, 150)
    else:
        blocks.append(_format_block(_add_minutes(fajr, 45), _add_minutes(fajr, 60), "Light stretch + Breakfast", "wellness", "normal"))
        deep_start = _add_minutes(fajr, 60)
    
    # === DEEP WORK BLOCK 1 ===
    dw_block1_end = _add_minutes(deep_start, min(dw_hours * 30, 150))  # First half of deep work
    top_priority = answers.get("top_priority", "Deep work session")
    blocks.append(_format_block(deep_start, dw_block1_end, f"⚔️ DEEP WORK: {top_priority}", "business", "critical"))
    
    # === DHUHR BREAK ===
    blocks.append(_format_block(dhuhr, _add_minutes(dhuhr, 15), "Dhuhr Salah", "deen", "critical"))
    blocks.append(_format_block(_add_minutes(dhuhr, 15), _add_minutes(dhuhr, 45), "Lunch + Reset", "food", "normal"))
    
    # === DEEP WORK BLOCK 2 ===
    dw2_start = _add_minutes(dhuhr, 45)
    dw2_end = _add_minutes(dw2_start, min(dw_hours * 30, 120))
    content = answers.get("content_plan", "Content creation")
    blocks.append(_format_block(dw2_start, dw2_end, f"⚔️ CONTENT: {content}", "business", "high"))
    
    # === ASR ===
    blocks.append(_format_block(asr, _add_minutes(asr, 15), "Asr Salah", "deen", "critical"))
    
    # === Meetings if any ===
    meetings = answers.get("meetings_commitments", "clear")
    if meetings.lower() != "clear" and meetings.strip():
        blocks.append(_format_block(_add_minutes(asr, 15), _add_minutes(asr, 75), f"📋 {meetings}", "logistics", "high"))
        post_meeting = _add_minutes(asr, 75)
    else:
        blocks.append(_format_block(_add_minutes(asr, 15), maghrib, "Deep work sprint / Overflow", "business", "normal"))
        post_meeting = maghrib
    
    # === MAGHRIB ===
    blocks.append(_format_block(maghrib, _add_minutes(maghrib, 15), "Maghrib Salah", "deen", "critical"))
    blocks.append(_format_block(_add_minutes(maghrib, 15), _add_minutes(maghrib, 45), "Dinner", "food", "normal"))
    
    # === ISHA + WIND DOWN ===
    blocks.append(_format_block(isha, _add_minutes(isha, 15), "Isha Salah", "deen", "critical"))
    blocks.append(_format_block(_add_minutes(isha, 15), _add_minutes(isha, 45), "Evening Adhkar + Reflection", "deen", "normal"))
    blocks.append(_format_block(_add_minutes(isha, 45), sleep_time, "Wind down — No screens", "wellness", "high"))
    blocks.append(_format_block(sleep_time, _add_minutes(sleep_time, 15), "Sleep", "rest", "critical"))
    
    # Calculate score
    productive_minutes = sum(b["duration_min"] for b in blocks if b["pillar"] in ["business", "fitness"])
    prayer_blocks = sum(1 for b in blocks if b["pillar"] == "deen")
    score = min(100, int(
        (productive_minutes / 60) * 12 +  # Up to ~60 points for productive hours
        prayer_blocks * 4 +                 # Up to ~28 for prayers
        (10 if wake <= fajr else 0) +       # Bonus for early wake
        (5 if not is_rest else 0)           # Bonus for training
    ))
    
    return {
        "mode": "warrior",
        "label": "⚔️ WARRIOR",
        "description": "Maximum output. Tight blocks. No buffer. Beast mode activated.",
        "blocks": blocks,
        "tomorrow_score": score,
        "total_productive_hours": round(productive_minutes / 60, 1),
        "wake_time": wake,
        "sleep_time": sleep_time,
    }


def _generate_king_schedule(answers: dict, context: dict) -> dict:
    """Generate balanced, sustainable schedule with recovery."""
    prayer = context.get("prayer_times", {})
    fajr = prayer.get("Fajr", "05:00").replace(" (IST)", "").strip()
    dhuhr = prayer.get("Dhuhr", "12:30").replace(" (IST)", "").strip()
    asr = prayer.get("Asr", "15:45").replace(" (IST)", "").strip()
    maghrib = prayer.get("Maghrib", "18:30").replace(" (IST)", "").strip()
    isha = prayer.get("Isha", "19:45").replace(" (IST)", "").strip()
    
    # King mode wakes at Fajr (not before)
    wake_answer = answers.get("wake_time", "")
    if "Before Fajr" in wake_answer:
        wake = fajr  # King still wakes at fajr, not 4:30
    elif "After Fajr" in wake_answer or "6:00" in wake_answer:
        wake = "06:00"
    else:
        wake = fajr
    
    workout = answers.get("workout_plan", "Rest day")
    is_rest = "rest" in workout.lower()
    
    sleep_answer = answers.get("sleep_target", "9:00 PM")
    if "9:30" in sleep_answer:
        sleep_time = "21:30"
    elif "10:00" in sleep_answer:
        sleep_time = "22:00"
    elif "10:30" in sleep_answer:
        sleep_time = "22:30"
    else:
        sleep_time = "21:00"
    
    blocks = []
    
    # === MORNING — Spacious ===
    blocks.append(_format_block(fajr, _add_minutes(fajr, 20), "Fajr Salah", "deen", "critical"))
    blocks.append(_format_block(_add_minutes(fajr, 20), _add_minutes(fajr, 60), "Quran + Adhkar + Journaling", "deen", "high"))
    blocks.append(_format_block(_add_minutes(fajr, 60), _add_minutes(fajr, 90), "Breakfast + Morning walk", "wellness", "normal"))
    
    if not is_rest:
        blocks.append(_format_block(_add_minutes(fajr, 90), _add_minutes(fajr, 180), f"{workout} (with warmup/cooldown)", "fitness", "high"))
        blocks.append(_format_block(_add_minutes(fajr, 180), _add_minutes(fajr, 210), "Shower + Recovery shake", "wellness", "normal"))
        deep_start = _add_minutes(fajr, 210)
    else:
        blocks.append(_format_block(_add_minutes(fajr, 90), _add_minutes(fajr, 120), "Active recovery / Walk", "wellness", "normal"))
        deep_start = _add_minutes(fajr, 120)
    
    # === DEEP WORK — Quality over quantity ===
    top_priority = answers.get("top_priority", "Deep work session")
    blocks.append(_format_block(deep_start, _add_minutes(deep_start, 90), f"Deep work: {top_priority}", "business", "high"))
    blocks.append(_format_block(_add_minutes(deep_start, 90), _add_minutes(deep_start, 105), "☕ Break — Step away", "rest", "normal"))
    blocks.append(_format_block(_add_minutes(deep_start, 105), _add_minutes(deep_start, 195), "Deep work: Continue", "business", "high"))
    
    # === DHUHR ===
    blocks.append(_format_block(dhuhr, _add_minutes(dhuhr, 20), "Dhuhr Salah", "deen", "critical"))
    blocks.append(_format_block(_add_minutes(dhuhr, 20), _add_minutes(dhuhr, 60), "Lunch + Relaxed break", "food", "normal"))
    
    # === AFTERNOON — Content ===
    content = answers.get("content_plan", "Content creation")
    afternoon_start = _add_minutes(dhuhr, 60)
    blocks.append(_format_block(afternoon_start, _add_minutes(afternoon_start, 90), f"Content: {content}", "business", "high"))
    blocks.append(_format_block(_add_minutes(afternoon_start, 90), asr, "Buffer / Overflow / Meetings", "logistics", "normal"))
    
    # === ASR ===
    blocks.append(_format_block(asr, _add_minutes(asr, 20), "Asr Salah", "deen", "critical"))
    
    # === Meetings ===
    meetings = answers.get("meetings_commitments", "clear")
    if meetings.lower() != "clear" and meetings.strip():
        blocks.append(_format_block(_add_minutes(asr, 20), _add_minutes(asr, 80), f"📋 {meetings}", "logistics", "normal"))
    else:
        blocks.append(_format_block(_add_minutes(asr, 20), _add_minutes(asr, 60), "Reading / Personal development", "self", "normal"))
    
    # === EVENING — Easy wind down ===
    blocks.append(_format_block(maghrib, _add_minutes(maghrib, 20), "Maghrib Salah", "deen", "critical"))
    blocks.append(_format_block(_add_minutes(maghrib, 20), _add_minutes(maghrib, 60), "Dinner with family / Social", "food", "normal"))
    
    blocks.append(_format_block(isha, _add_minutes(isha, 20), "Isha Salah", "deen", "critical"))
    blocks.append(_format_block(_add_minutes(isha, 20), _add_minutes(isha, 50), "Light reading + Evening Adhkar", "deen", "normal"))
    blocks.append(_format_block(_add_minutes(isha, 50), sleep_time, "Wind down — Gratitude + Plan", "wellness", "normal"))
    blocks.append(_format_block(sleep_time, _add_minutes(sleep_time, 15), "Sleep", "rest", "critical"))
    
    # Calculate score — King optimizes for balance
    productive_minutes = sum(b["duration_min"] for b in blocks if b["pillar"] in ["business", "fitness"])
    prayer_blocks = sum(1 for b in blocks if b["pillar"] == "deen")
    rest_blocks = sum(1 for b in blocks if b["pillar"] in ["rest", "wellness", "food"])
    
    score = min(100, int(
        (productive_minutes / 60) * 10 +    # Up to ~50 for productive hours
        prayer_blocks * 4 +                  # Up to ~28 for prayers
        rest_blocks * 3 +                    # Balance bonus
        10                                   # Sustainability bonus
    ))
    
    return {
        "mode": "king",
        "label": "👑 KING",
        "description": "Strategic spacing. Recovery built in. Sustainable dominance.",
        "blocks": blocks,
        "tomorrow_score": score,
        "total_productive_hours": round(productive_minutes / 60, 1),
        "wake_time": wake,
        "sleep_time": sleep_time,
    }

def _generate_llm_schedules(answers: dict, context: dict, api_key: str) -> dict:
    prompt = f"""
You are the Qadr Protocol AI, an elite night planner.
Based on the following context and user answers, generate two schedule variations for tomorrow:
1. WARRIOR mode: Maximum output, tight blocks, no buffer, aggressive.
2. KING mode: Strategic spacing, recovery built in, balanced, sustainable.

Rules:
- Output MUST be valid JSON matching this schema exactly:
{{
  "warrior": {{
    "label": "⚔️ WARRIOR",
    "description": "Maximum output. Tight blocks.",
    "blocks": [
      {{"start": "HH:MM", "end": "HH:MM", "activity": "string", "pillar": "deen|business|fitness|wellness|self|logistics|rest|food", "icon": "emoji", "priority": "critical|high|normal", "duration_min": 0}}
    ],
    "tomorrow_score": 90,
    "total_productive_hours": 8.5,
    "wake_time": "HH:MM",
    "sleep_time": "HH:MM"
  }},
  "king": {{
    "label": "👑 KING",
    "description": "Strategic spacing. Recovery built in.",
    "blocks": [...],
    "tomorrow_score": 85,
    "total_productive_hours": 6.0,
    "wake_time": "HH:MM",
    "sleep_time": "HH:MM"
  }}
}}
- Integrate the 5 daily prayers from the context exactly at their times as 'critical' priority blocks in both schedules.
- Base the wake and sleep times on the user's answers.
- The 'pillar' field must be one of: deen, business, fitness, wellness, self, logistics, rest, food.

Context:
{json.dumps(context, indent=2)}

User Answers:
{json.dumps(answers, indent=2)}
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "mistralai/mistral-large-3-675b-instruct-2512",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"}
    }
    
    resp = requests.post("https://integrate.api.nvidia.com/v1/chat/completions", headers=headers, json=payload, timeout=8)
    resp.raise_for_status()
    
    content = resp.json()["choices"][0]["message"]["content"]
    data = json.loads(content)
    
    if "warrior" in data:
        data["warrior"]["mode"] = "warrior"
    if "king" in data:
        data["king"]["mode"] = "king"
        
    return data

@router.post("/generate")
async def generate_schedules(data: GenerateInput):
    """
    Generate 2 schedule variations: WARRIOR (aggressive) and KING (balanced).
    Called after all questions are answered.
    """
    with get_db() as conn:
        session = conn.execute(
            "SELECT * FROM qadr_sessions WHERE id = ?", (data.session_id,)
        ).fetchone()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        answers = json.loads(session["answers_json"] or "{}")
        context = json.loads(session["context_json"] or "{}")
    
    import os
    nvidia_api_key = os.getenv("NVIDIA_API_KEY", "")
    
    warrior = None
    king = None
    
    if nvidia_api_key and nvidia_api_key != "your_nvidia_api_key_here":
        try:
            print("[QADR] Calling NVIDIA API for dynamic schedule generation...")
            llm_result = _generate_llm_schedules(answers, context, nvidia_api_key)
            warrior = llm_result.get("warrior")
            king = llm_result.get("king")
            print("[QADR] Successfully generated schedules via NVIDIA API.")
        except Exception as e:
            print(f"[QADR] NVIDIA API generation failed: {e}. Falling back to templates.")
            
    # Fallback to templates if LLM failed or wasn't configured
    if not warrior or not king:
        warrior = _generate_warrior_schedule(answers, context)
        king = _generate_king_schedule(answers, context)
    
    now_iso = datetime.now(BANGALORE_TZ).isoformat()
    
    with get_db() as conn:
        # Save warrior schedule
        cursor = conn.execute(
            """INSERT INTO qadr_schedules (session_id, mode, blocks_json, tomorrow_score, total_productive_hours, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (data.session_id, "warrior", json.dumps(warrior["blocks"]), warrior["tomorrow_score"],
             warrior["total_productive_hours"], now_iso)
        )
        warrior["schedule_id"] = cursor.lastrowid
        
        # Save king schedule
        cursor = conn.execute(
            """INSERT INTO qadr_schedules (session_id, mode, blocks_json, tomorrow_score, total_productive_hours, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (data.session_id, "king", json.dumps(king["blocks"]), king["tomorrow_score"],
             king["total_productive_hours"], now_iso)
        )
        king["schedule_id"] = cursor.lastrowid
        
        # Update session status
        conn.execute(
            "UPDATE qadr_sessions SET status = 'generated', updated_at = ? WHERE id = ?",
            (now_iso, data.session_id)
        )
    
    return {
        "session_id": data.session_id,
        "target_date": context.get("target_date"),
        "warrior": warrior,
        "king": king,
    }


@router.post("/select")
async def select_schedule(data: SelectScheduleInput):
    """Lock in a schedule for tomorrow."""
    with get_db() as conn:
        schedule = conn.execute(
            "SELECT * FROM qadr_schedules WHERE id = ?", (data.schedule_id,)
        ).fetchone()
        
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        
        session = conn.execute(
            "SELECT * FROM qadr_sessions WHERE id = ?", (data.session_id,)
        ).fetchone()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        target_date = session["target_date"]
        now_iso = datetime.now(BANGALORE_TZ).isoformat()
        
        # Upsert selection for the target date
        conn.execute(
            """INSERT OR REPLACE INTO qadr_selected (date, schedule_id, session_id, mode, created_at)
               VALUES (?, ?, ?, ?, ?)""",
            (target_date, data.schedule_id, data.session_id, schedule["mode"], now_iso)
        )
        
        # Update session status
        conn.execute(
            "UPDATE qadr_sessions SET status = 'selected', updated_at = ? WHERE id = ?",
            (now_iso, data.session_id)
        )
    
    return {
        "status": "locked_in",
        "date": target_date,
        "mode": schedule["mode"],
        "message": f"Tomorrow is set. {'⚔️ WARRIOR' if schedule['mode'] == 'warrior' else '👑 KING'} mode locked. Sleep well, soldier.",
    }


@router.get("/active")
async def get_active_schedule():
    """Get today's active schedule (selected last night)."""
    today_str = date.today().isoformat()
    
    with get_db() as conn:
        selected = conn.execute(
            "SELECT * FROM qadr_selected WHERE date = ?", (today_str,)
        ).fetchone()
        
        if not selected:
            return {"active": False, "message": "No schedule set for today."}
        
        schedule = conn.execute(
            "SELECT * FROM qadr_schedules WHERE id = ?", (selected["schedule_id"],)
        ).fetchone()
        
        if not schedule:
            return {"active": False, "message": "Schedule data not found."}
    
    return {
        "active": True,
        "date": today_str,
        "mode": selected["mode"],
        "blocks": json.loads(schedule["blocks_json"]),
        "tomorrow_score": schedule["tomorrow_score"],
        "total_productive_hours": schedule["total_productive_hours"],
        "completion_pct": selected["completion_pct"],
    }


@router.get("/history")
async def get_schedule_history(days: int = 14):
    """Get past schedule selections and their completion rates."""
    with get_db() as conn:
        rows = conn.execute(
            """SELECT s.date, s.mode, s.completion_pct, sc.tomorrow_score, sc.total_productive_hours
               FROM qadr_selected s
               JOIN qadr_schedules sc ON s.schedule_id = sc.id
               ORDER BY s.date DESC
               LIMIT ?""",
            (days,)
        ).fetchall()
    
    return [
        {
            "date": r["date"],
            "mode": r["mode"],
            "completion_pct": r["completion_pct"],
            "tomorrow_score": r["tomorrow_score"],
            "productive_hours": r["total_productive_hours"],
        }
        for r in rows
    ]
