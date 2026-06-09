"""
VIRTUAL MIND: CORE ALIGNMENT ENGINE
VERSION: 2.0 — THE SUPREME UPGRADE

This module is the soul of the Virtual Mind. It loads the guardrails,
applies the Nafs filter, retrieves philosophical context from WORKS,
and checks accountability status against Phase 0 checkpoints.
"""

import os
import json
from datetime import datetime, date


# ─── PHASE 0 CONFIGURATION ────────────────────────────────────────────────────
PHASE0_START = date(2026, 2, 22)
PHASE0_90DAY_CHECKPOINT = date(2026, 5, 22)

DAILY_NON_NEGOTIABLES = [
    "5 Salah on time (Fajr is the litmus test)",
    "30 min Quran minimum",
    "4 hours Deep Work",
    "1 hour Physical Training",
    "1 hour Reading before bed",
    "Adhkar morning & evening",
    "No phone before 8 AM",
    "No sugar on weekdays",
]

CHECKPOINT_QUESTIONS = [
    "Have I prayed ALL 5 Salah on time, every day, for 90 days?",
    "Can I read basic Arabic?",
    'Have I finished "The Sealed Nectar" and "Kitab At-Tawheed"?',
    "Is my AI startup MVP (Elesium) taking shape?",
    "Have I published at least 10 essays?",
    "Have I run at least a half-marathon distance in training?",
    "Am I waking up for Fajr without an alarm?",
    "Do I have a circle of at least 3-5 like-minded Muslim brothers?",
]


# ─── NAFS FILTER ───────────────────────────────────────────────────────────────

class NafsFilter:
    """
    Classifies user input against the Nafs al-Ammorah triggers.
    Detects comfort-seeking, avoidance, and spiritual drift.
    """

    # Expanded from 11 keywords to semantic pattern categories
    AMMORAH_PATTERNS = {
        "comfort_seeking": [
            "take it easy", "deserve a break", "relax", "chill",
            "take a day off", "not in the mood", "maybe later",
            "need some rest", "burnt out", "overwhelmed",
        ],
        "avoidance": [
            "skip", "later", "tomorrow", "not today", "can't be bothered",
            "don't feel like", "what's the point", "waste of time",
            "not worth", "too hard", "too much",
        ],
        "procrastination": [
            "procrastinate", "procrastinating", "lazy", "being lazy",
            "just scrolling", "lost track of time", "got distracted",
            "watching reels", "binge", "wasted the day",
        ],
        "quit_signals": [
            "quit", "give up", "stop trying", "can't do this",
            "maybe this isn't for me", "not cut out for",
            "everyone else is better", "imposter", "fraud",
        ],
        "spiritual_drift": [
            "missed fajr", "didn't pray", "skipped salah",
            "forgot quran", "haven't read", "too tired to pray",
            "missed prayer", "slept through fajr",
        ],
    }

    @classmethod
    def analyze(cls, user_input: str) -> dict:
        """
        Analyze user input for Nafs al-Ammorah triggers.
        Returns dict with detected patterns and severity.
        """
        input_lower = user_input.lower()
        detected = {}

        for category, patterns in cls.AMMORAH_PATTERNS.items():
            matches = [p for p in patterns if p in input_lower]
            if matches:
                detected[category] = matches

        severity = "none"
        if detected:
            if len(detected) >= 3:
                severity = "critical"
            elif len(detected) >= 2:
                severity = "high"
            elif any(k in detected for k in ["quit_signals", "spiritual_drift"]):
                severity = "high"
            else:
                severity = "moderate"

        return {
            "is_ammorah": bool(detected),
            "severity": severity,
            "patterns": detected,
            "category_count": len(detected),
        }


# ─── PHILOSOPHICAL CONTEXT ────────────────────────────────────────────────────

# The user's own convictions, distilled from 16 WORKS entries
PHILOSOPHICAL_CORE = {
    "power": "The drive for power creates a barricade between a social being and a winner.",
    "ego": "Ego is the biggest asset — it builds character like nothing else and breaks like nothing else. Wield it consciously.",
    "motivation": "Motivation is fake. Purpose and Responsibility are the only real drivers. Rage, ego, and anger channeled positively are the core.",
    "introspection": "Introspection is a curse when not acted upon. The purpose of life is to chase perfection knowing it can't be achieved.",
    "failure": "Fall 100 times, laugh at the 100th, get up the 101st. Failure gives things value. Be among the players who play great.",
    "communication": "Logic first, emotional statement as the finishing blow. Believe what you say and say what you believe.",
    "love": "Love is a path, not a destination. Grief is the price you pay for love. External love is a product of time.",
    "change": "The only way to correct the world is to correct yourself. Standards come from seeking God.",
    "society": "Influence is the currency of power. Temporary pleasure corrupts. We are heading toward danger.",
    "suppressed_voice": "Being stopped from speaking invokes rage. Trying is always a comma, never a full stop.",
    "underachieving": "Knowing what you can be and not doing what it takes is a form of Hell.",
    "nafs": "The devil is a reinforcer, not an initiator. Sins bring us closer to God through the cycle of failure and repentance.",
}

# Topic keywords for matching input to relevant philosophy
PHILOSOPHY_KEYWORDS = {
    "power": ["power", "ambition", "winning", "competition", "greatness", "leader"],
    "ego": ["ego", "pride", "arrogance", "humility", "self-esteem", "confidence"],
    "motivation": ["motivation", "purpose", "drive", "responsibility", "discipline", "lazy"],
    "introspection": ["think", "reflect", "introspect", "self-aware", "analyze", "understand"],
    "failure": ["fail", "failure", "mistake", "error", "wrong", "setback", "fall", "lose"],
    "communication": ["speak", "communicate", "argue", "convince", "debate", "persuade", "rhetoric"],
    "love": ["love", "relationship", "grief", "heart", "care", "partner", "emotion"],
    "change": ["change", "improve", "correct", "fix", "standard", "moral", "values"],
    "society": ["society", "generation", "youth", "culture", "corruption", "influence"],
    "suppressed_voice": ["frustrated", "angry", "rage", "silenced", "can't speak", "held back"],
    "underachieving": ["potential", "underachieve", "settling", "mediocre", "average", "ordinary"],
    "nafs": ["sin", "temptation", "nafs", "devil", "iblees", "repent", "forgive", "tawbah"],
}


def get_philosophical_context(user_input: str) -> str:
    """
    Returns relevant WORKS philosophy for the current input.
    Matches user input keywords against the philosophical core.
    """
    input_lower = user_input.lower()
    relevant = []

    for topic, keywords in PHILOSOPHY_KEYWORDS.items():
        if any(kw in input_lower for kw in keywords):
            relevant.append(f"• YOUR OWN WORDS on {topic.upper()}: {PHILOSOPHICAL_CORE[topic]}")

    if not relevant:
        # Default — always remind of the core
        relevant.append(f"• YOUR OWN WORDS: {PHILOSOPHICAL_CORE['underachieving']}")

    return "\n".join(relevant)


# ─── ACCOUNTABILITY STATUS ─────────────────────────────────────────────────────

def get_accountability_status() -> str:
    """
    Returns current Phase 0 progress status.
    Calculates days since start, days until checkpoint, progress percentage.
    """
    today = date.today()
    days_in = (today - PHASE0_START).days
    days_remaining = (PHASE0_90DAY_CHECKPOINT - today).days
    total_days = (PHASE0_90DAY_CHECKPOINT - PHASE0_START).days
    progress_pct = min(100, round((days_in / total_days) * 100, 1))

    status = (
        f"⚔️ PHASE 0: BECOME UNDENIABLE\n"
        f"   Day {days_in} of 90 | {days_remaining} days remaining | {progress_pct}% elapsed\n"
        f"   Started: {PHASE0_START.strftime('%d %B %Y')}\n"
        f"   Checkpoint: {PHASE0_90DAY_CHECKPOINT.strftime('%d %B %Y')}"
    )
    return status


def get_checkpoint_questions() -> str:
    """Returns formatted 90-day checkpoint questions."""
    lines = ["📋 90-DAY CHECKPOINT — Score yourself honestly:"]
    for i, q in enumerate(CHECKPOINT_QUESTIONS, 1):
        lines.append(f"   {i}. {q}")
    lines.append("\nAnswer YES or NO to each. If any answer is NO — you've drifted.")
    return "\n".join(lines)


def get_daily_checklist() -> str:
    """Returns formatted daily non-negotiables, with checked off values for today."""
    try:
        from brain.tracker import tracker
        from datetime import date
        today_data = tracker.load_data().get(date.today().isoformat(), {})
    except ImportError:
        today_data = {}

    lines = ["📌 DAILY NON-NEGOTIABLES [TODAY]:"]
    
    item_map = {
        "5 Salah on time (Fajr is the litmus test)": "salah_5_on_time",
        "30 min Quran minimum": "quran_30min",
        "4 hours Deep Work": "deep_work_hours",
        "1 hour Physical Training": "physical_training",
        "1 hour Reading before bed": "reading_1hr",
        "Adhkar morning & evening": "adhkar",
        "No phone before 8 AM": "no_phone_before_8",
        "No sugar on weekdays": "no_sugar",
    }
    
    for item in DAILY_NON_NEGOTIABLES:
        key = item_map.get(item)
        if key in today_data:
            val = today_data[key]
            if isinstance(val, bool):
                mark = 'x' if val else ' '
                lines.append(f"   -[{mark}] {item}")
            else:
                lines.append(f"   -[x] {item} ({val})")
        else:
            lines.append(f"   -[ ] {item}")
            
    return "\n".join(lines)


# ─── SYSTEM PROMPT LOADER ──────────────────────────────────────────────────────

def get_system_prompt() -> str:
    """Reads the system prompt from the guardrails.md file."""
    try:
        file_path = os.path.join(os.path.dirname(__file__), 'guardrails.md')
        with open(file_path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        return "Error: guardrails.md not found. System integrity compromised."
