"""
VIRTUAL MIND: SELF-IMPROVEMENT ENGINE
VERSION: 2.0 — THE SUPREME UPGRADE

MockReflector is DEAD. Replaced with LLMReflector that:
1. Reads full session logs
2. Analyzes via Gemini for patterns, contradictions, growth areas
3. Proposes guardrail updates
4. Logs every evolution in evolution_log.json
5. Auto-applies approved patterns
"""

import json
import os
from datetime import datetime, timedelta
from brain.core_alignment import get_system_prompt
from brain.memory import memory_system


# ─── PATTERN TRACKER ──────────────────────────────────────────────────────────

PATTERNS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "logs", "patterns.json"
)


def _load_patterns() -> dict:
    if os.path.exists(PATTERNS_PATH):
        try:
            with open(PATTERNS_PATH, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    return {"drift_events": [], "commitments": [], "growth_moments": []}


def _save_patterns(data: dict):
    os.makedirs(os.path.dirname(PATTERNS_PATH), exist_ok=True)
    with open(PATTERNS_PATH, "w") as f:
        json.dump(data, f, indent=2)


def log_drift_event(drift_type: str, trigger: str):
    """Log a drift event detected during a session."""
    patterns = _load_patterns()
    patterns["drift_events"].append({
        "date": datetime.now().isoformat(),
        "type": drift_type,
        "trigger": trigger,
        "resolved": False,
    })
    _save_patterns(patterns)


def log_commitment(commitment: str, deadline_days: int = 7):
    """Log a commitment made during a session."""
    patterns = _load_patterns()
    patterns["commitments"].append({
        "date": datetime.now().isoformat(),
        "commitment": commitment,
        "deadline": (datetime.now() + timedelta(days=deadline_days)).isoformat(),
        "status": "pending",
    })
    _save_patterns(patterns)


def log_growth_moment(description: str):
    """Log a growth moment detected during a session."""
    patterns = _load_patterns()
    patterns["growth_moments"].append({
        "date": datetime.now().isoformat(),
        "description": description,
    })
    _save_patterns(patterns)


def get_trend_report() -> str:
    """Analyze patterns.json for recurring trends."""
    patterns = _load_patterns()
    lines = []

    # Drift trend analysis
    drift_events = patterns.get("drift_events", [])
    if drift_events:
        recent_drifts = [d for d in drift_events if (datetime.now() - datetime.fromisoformat(d["date"])).days <= 14]
        if recent_drifts:
            from collections import Counter
            drift_types = Counter(d["type"] for d in recent_drifts)
            lines.append(f"\n⚠️  DRIFT TRENDS (last 14 days): {len(recent_drifts)} events")
            for dtype, count in drift_types.most_common(3):
                lines.append(f"   - {dtype}: {count} times")

    # Pending commitments
    commitments = patterns.get("commitments", [])
    pending = [c for c in commitments if c["status"] == "pending"]
    overdue = [c for c in pending if datetime.fromisoformat(c["deadline"]) < datetime.now()]
    if overdue:
        lines.append(f"\n🔴 OVERDUE COMMITMENTS: {len(overdue)}")
        for c in overdue[:3]:
            lines.append(f"   - {c['commitment']} (due {c['deadline'].split('T')[0]})")
    if pending and not overdue:
        lines.append(f"\n🟡 PENDING COMMITMENTS: {len(pending)}")
        for c in pending[:3]:
            lines.append(f"   - {c['commitment']} (due {c['deadline'].split('T')[0]})")

    # Growth moments
    growth = patterns.get("growth_moments", [])
    recent_growth = [g for g in growth if (datetime.now() - datetime.fromisoformat(g["date"])).days <= 14]
    if recent_growth:
        lines.append(f"\n🌱 GROWTH MOMENTS (last 14 days): {len(recent_growth)}")
        for g in recent_growth[-3:]:
            lines.append(f"   - {g['description']}")

    return "\n".join(lines) if lines else "No pattern data yet. Keep using the system."


# ─── EVOLUTION LOG ─────────────────────────────────────────────────────────────

EVOLUTION_LOG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "logs", "evolution_log.json"
)


def _load_evolution_log() -> list:
    """Load the evolution log, creating it if it doesn't exist."""
    if os.path.exists(EVOLUTION_LOG_PATH):
        try:
            with open(EVOLUTION_LOG_PATH, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    return []


def _save_evolution_log(log: list):
    """Save the evolution log."""
    os.makedirs(os.path.dirname(EVOLUTION_LOG_PATH), exist_ok=True)
    with open(EVOLUTION_LOG_PATH, "w") as f:
        json.dump(log, f, indent=2)


def get_evolution_history() -> str:
    """Returns formatted evolution history for display."""
    log = _load_evolution_log()
    if not log:
        return "📊 No evolution history yet. Run 'reflect' after a session."

    lines = ["📊 VIRTUAL MIND EVOLUTION LOG", "=" * 50]
    for entry in log[-10:]:  # Show last 10 entries
        lines.append(f"\n🕐 {entry.get('timestamp', 'Unknown')}")
        lines.append(f"   Assessment: {entry.get('overall_assessment', 'N/A')}")

        patterns = entry.get("patterns_detected", [])
        if patterns:
            lines.append(f"   Patterns: {', '.join(patterns[:3])}")

        growth = entry.get("growth_areas", [])
        if growth:
            lines.append(f"   Growth: {', '.join(growth[:3])}")

        drift = entry.get("drift_areas", [])
        if drift:
            lines.append(f"   ⚠️ Drift: {', '.join(drift[:3])}")

        updates = entry.get("guardrail_updates", [])
        if updates:
            lines.append(f"   🔧 Updates Applied: {len(updates)}")

    return "\n".join(lines)


# ─── LLM REFLECTOR ────────────────────────────────────────────────────────────

class LLMReflector:
    """
    Real self-improvement engine powered by Gemini.
    Analyzes sessions, detects patterns, proposes guardrail updates.
    """

    def __init__(self):
        # Lazy-load the LLM to avoid circular imports
        self._llm = None

    def _get_llm(self):
        if self._llm is None:
            from brain.llm import _get_llm
            self._llm = _get_llm()
        return self._llm

    def analyze_and_update(self, current_guardrails: str, session_logs: list) -> str:
        """
        Analyze session logs and propose guardrail updates.
        Uses real LLM for deep pattern analysis.
        """
        llm = self._get_llm()

        # Build analysis prompt
        analysis_prompt = (
            "You are the self-improvement engine of a Virtual Mind system.\n"
            "Your job is to analyze session logs and identify patterns for growth.\n\n"
            f"CURRENT GUARDRAILS (summarized):\n{current_guardrails[:2000]}\n\n"
            f"SESSION LOGS ({len(session_logs)} interactions):\n"
        )

        # Add log entries (limit to prevent token overflow)
        for i, entry in enumerate(session_logs[-20:]):  # Last 20 interactions
            analysis_prompt += (
                f"\n--- Interaction {i+1} ---\n"
                f"User: {entry.get('user_input', 'N/A')}\n"
                f"Response Mode: {entry.get('ai_response', 'N/A')[:200]}...\n"
            )

        analysis_prompt += (
            "\n\nANALYZE AND RESPOND WITH THIS EXACT JSON FORMAT "
            "(no markdown, no code blocks, just raw JSON):\n"
            '{\n'
            '  "patterns_detected": ["behavioral patterns observed"],\n'
            '  "ambition_contradictions": ["contradictions with stated ambitions"],\n'
            '  "new_insights": ["new worldview insights discovered"],\n'
            '  "guardrail_updates": ["proposed new rules"],\n'
            '  "growth_areas": ["areas of growth"],\n'
            '  "drift_areas": ["areas of drift"],\n'
            '  "overall_assessment": "one paragraph summary"\n'
            '}\n'
        )

        try:
            response = llm.model.generate_content(analysis_prompt)
            response_text = response.text.strip()

            # Clean up response — remove any markdown code blocks
            if response_text.startswith("```"):
                response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text.rsplit("```", 1)[0]
            response_text = response_text.strip()

            analysis = json.loads(response_text)
        except (json.JSONDecodeError, Exception) as e:
            print(f"[REFLECTOR] LLM analysis parsing failed: {e}")
            analysis = {
                "patterns_detected": ["Unable to parse — manual review needed"],
                "ambition_contradictions": [],
                "new_insights": [],
                "guardrail_updates": [],
                "growth_areas": [],
                "drift_areas": [],
                "overall_assessment": f"Analysis generation failed: {e}",
            }

        # Log the evolution
        evolution_entry = {
            "timestamp": datetime.now().isoformat(),
            "session_size": len(session_logs),
            **analysis,
        }
        log = _load_evolution_log()
        log.append(evolution_entry)
        _save_evolution_log(log)

        # Store as reflection memory
        assessment = analysis.get("overall_assessment", "No assessment")
        memory_system.add_reflection(
            f"Session Reflection: {assessment}",
            metadata={"patterns": analysis.get("patterns_detected", [])},
        )

        # Store any new insights as philosophical insights
        for insight in analysis.get("new_insights", []):
            memory_system.add_philosophical_insight(
                insight,
                metadata={"source": "self_improvement_reflection"},
            )

        # Apply guardrail updates by appending to the guardrails file
        new_guardrails = current_guardrails
        updates = analysis.get("guardrail_updates", [])
        if updates:
            # Append new rules to boundary control section
            update_block = "\n\n### 🔧 AUTO-LEARNED RULES (from session analysis)\n"
            update_block += f"*Added: {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n"
            for rule in updates:
                update_block += f"* {rule}\n"

            new_guardrails += update_block

        return new_guardrails


# ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

def analyze_and_update_guardrails():
    """
    Main function to trigger the self-improvement loop.
    Now with pattern tracking, trend detection, and approval step.
    """
    print("\n🧠 [SELF-IMPROVEMENT] Initiating Deep Session Analysis...")

    # 1. Read current guardrails
    current_guardrails = get_system_prompt()

    # 2. Read session logs
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    try:
        log_files = [
            f for f in os.listdir(log_dir)
            if f.startswith("session_") and f.endswith(".json")
        ]
        log_files.sort(reverse=True)  # Newest first

        if not log_files:
            print("[SELF-IMPROVEMENT] No session logs found to analyze.")
            return

        # Read the latest session log
        latest_log_file = os.path.join(log_dir, log_files[0])
        with open(latest_log_file, "r") as f:
            session_logs = json.load(f)

        if not session_logs:
            print("[SELF-IMPROVEMENT] Latest session log is empty.")
            return

        print(f"   📄 Analyzing: {log_files[0]} ({len(session_logs)} interactions)")

    except Exception as e:
        print(f"[SELF-IMPROVEMENT] Error reading logs: {e}")
        return

    # 3. Analyze with LLM Reflector
    reflector = LLMReflector()
    updated_guardrails = reflector.analyze_and_update(current_guardrails, session_logs)

    # 4. Show trend report
    trend_report = get_trend_report()
    if trend_report:
        print(trend_report)

    # 5. Approval step for guardrail updates
    if updated_guardrails != current_guardrails:
        print("\n🔧 PROPOSED GUARDRAIL UPDATES:")
        # Show the diff (just the new rules)
        diff = updated_guardrails[len(current_guardrails):]
        print(diff)
        
        try:
            approval = input("\n   Apply these guardrail updates? (y/n): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            approval = "n"
            
        if approval in ("y", "yes"):
            guardrails_path = os.path.join(os.path.dirname(__file__), "guardrails.md")
            with open(guardrails_path, "w") as f:
                f.write(updated_guardrails)
            print("✅ [SELF-IMPROVEMENT] Guardrails EVOLVED based on session analysis.")
        else:
            print("⏭️  Guardrail updates skipped. No changes made.")
    else:
        print("✅ [SELF-IMPROVEMENT] No guardrail changes needed. Holding steady.")

    print("   Analysis stored as reflection memory.")
