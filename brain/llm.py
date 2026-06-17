"""
VIRTUAL MIND: LLM PROCESSING ENGINE
VERSION: 2.0 — THE SUPREME UPGRADE

5 Response Modes: STANDARD, ACCOUNTABILITY, PHILOSOPHICAL, TACTICAL, SPIRITUAL
Semantic drift detection using the NafsFilter.
Full context assembly with worldview, ambitions, philosophy, and Phase 0 status.
"""

import os
import json
import requests
from dotenv import load_dotenv
from brain.core_alignment import (
    get_system_prompt,
    NafsFilter,
    get_philosophical_context,
    get_accountability_status,
)
from brain.memory import memory_system

load_dotenv()


# ─── RESPONSE MODE DEFINITIONS ────────────────────────────────────────────────

RESPONSE_MODES = {
    "STANDARD": "Respond as the user's Best Version with aligned, actionable advice.",
    "ACCOUNTABILITY": (
        "DRIFT DETECTED. You are the user's Nafs al-Mutmainna — the reinforcing force. "
        "1. Call out the drift directly using their own WORKS philosophy. "
        "2. Remind them WHO they said they want to be. "
        "3. Give ONE concrete 5-minute action step. "
        "4. End with a line from their own writings that fires them up. "
        "Speak in first person plural (we/us/our)."
    ),
    "PHILOSOPHICAL": (
        "The user is thinking deeply. Engage with their OWN philosophical frameworks from WORKS. "
        "Do not introduce external philosophy — use THEIR convictions as the foundation. "
        "Challenge them to sharpen their thinking, then demand ONE action from the insight."
    ),
    "TACTICAL": (
        "The user is asking about the startup (Elesium), outreach, campaigns, or strategic execution. "
        "Respond with precision. Enforce hard rules: n8n.io (no Make.com), PlusVibe (no Instantly), "
        "mails.so (no Hunter), Google Sheets (no CRM like Salesforce). "
        "Lead with 'Pain Over Profile'. "
        "Structure: Situation → Analysis → Recommendation → Next Step → Timeline."
    ),
    "SPIRITUAL": (
        "Deen-related topic. Respond with the depth of their Islamic knowledge framework. "
        "Reference the Nafs model, Seerah parallels, Phase 0 Islamic study obligations. "
        "Always connect spiritual insights to actionable spiritual practice."
    ),
}


# ─── SPIRITUAL/TACTICAL KEYWORDS ──────────────────────────────────────────────

SPIRITUAL_KEYWORDS = [
    "salah", "prayer", "fajr", "quran", "allah", "deen", "islam", "ummah",
    "sunnah", "hadith", "seerah", "prophet", "tawbah", "repent", "sin",
    "nafs", "iblees", "devil", "jannah", "akhirah", "hereafter", "masjid",
    "ramadan", "fasting", "zakat", "hajj", "dawah", "caliphate", "khilafah",
    "tawheed", "aqeedah", "fiqh", "tafsir", "dhikr", "dua", "tawakkul",
    "sabr", "patience", "shukr", "gratitude", "imam", "scholar",
]

TACTICAL_KEYWORDS = [
    "startup", "elesium", "mvp", "product", "launch", "revenue", "customer",
    "user", "market", "competitor", "pricing", "business", "strategy",
    "roadmap", "investor", "funding", "team", "hire", "scale", "growth",
    "code", "build", "deploy", "architecture", "api", "database",
    "marketing", "sales", "brand", "audience", "content", "social media",
    "essay", "publish", "blog", "newsletter", "podcast", "youtube", "outreach", 
    "n8n", "plusvibe", "lead gen", "campaign", "automation", "b2b",
]

PHILOSOPHICAL_KEYWORDS = [
    "think", "believe", "meaning", "purpose", "life", "death", "truth",
    "reality", "perception", "consciousness", "wisdom", "power", "ego",
    "introspection", "society", "generation", "human nature", "morality",
    "philosophy", "existence", "freedom", "justice", "influence",
]


# ─── MODE DETECTION ───────────────────────────────────────────────────────────

def _keyword_confidence(user_input: str) -> tuple:
    """
    Returns (best_mode, confidence) based on keyword matching.
    Confidence: 'high' if one category dominates, 'low' if ambiguous/none.
    """
    input_lower = user_input.lower()
    scores = {
        "SPIRITUAL": sum(1 for kw in SPIRITUAL_KEYWORDS if kw in input_lower),
        "TACTICAL": sum(1 for kw in TACTICAL_KEYWORDS if kw in input_lower),
        "PHILOSOPHICAL": sum(1 for kw in PHILOSOPHICAL_KEYWORDS if kw in input_lower),
    }
    top_mode = max(scores, key=scores.get)
    top_score = scores[top_mode]
    sorted_scores = sorted(scores.values(), reverse=True)

    if top_score == 0:
        return "STANDARD", "low"
    if top_score >= 2 and (len(sorted_scores) < 2 or sorted_scores[0] > sorted_scores[1]):
        return top_mode, "high"
    return top_mode, "low"


def _llm_classify_mode(user_input: str) -> str:
    """
    Use a lightweight LLM call to classify the user's intent into a response mode.
    Falls back to STANDARD if anything goes wrong.
    """
    try:
        llm = _get_llm()
        prompt = (
            "Classify the following user message into exactly ONE of these categories: "
            "STANDARD, ACCOUNTABILITY, PHILOSOPHICAL, TACTICAL, SPIRITUAL.\n\n"
            "Rules:\n"
            "- SPIRITUAL: Anything related to Islam, prayer, Quran, faith, sin, repentance.\n"
            "- TACTICAL: Anything about business, startups, strategy, marketing, building products.\n"
            "- PHILOSOPHICAL: Deep thinking about life, meaning, purpose, human nature, introspection.\n"
            "- ACCOUNTABILITY: User is drifting, procrastinating, making excuses, seeking comfort.\n"
            "- STANDARD: General conversation that doesn't fit the above.\n\n"
            f"User message: \"{user_input}\"\n\n"
            "Respond with ONLY the category name, nothing else."
        )
        response = llm.model.generate_content(prompt)
        mode = response.text.strip().upper()
        if mode in RESPONSE_MODES:
            return mode
    except Exception:
        pass
    return "STANDARD"


def detect_response_mode(user_input: str, nafs_analysis: dict) -> str:
    """
    Determines the appropriate response mode based on input analysis.
    Uses keywords as a fast pre-filter, falls back to LLM for ambiguous inputs.
    Priority: ACCOUNTABILITY > keyword/LLM classification > STANDARD
    """
    # Priority 1: Drift detected — ACCOUNTABILITY mode
    if nafs_analysis["is_ammorah"] and nafs_analysis["severity"] in ("high", "critical"):
        return "ACCOUNTABILITY"

    # Priority 2: Moderate drift on spiritual topics
    if nafs_analysis["is_ammorah"]:
        return "ACCOUNTABILITY"

    # Priority 3: Keyword fast-path
    keyword_mode, confidence = _keyword_confidence(user_input)
    if confidence == "high":
        return keyword_mode

    # Priority 4: LLM fallback for ambiguous inputs
    return _llm_classify_mode(user_input)


# ─── NVIDIA LLM ───────────────────────────────────────────────────────────────

from openai import OpenAI

class NvidiaLLM:
    """
    Real LLM integration using NVIDIA API via OpenAI SDK.
    Now with multi-modal response generation across 5 modes.
    """

    def __init__(self, model_name: str = "meta/llama-3.1-70b-instruct"):
        self.api_key = os.getenv("NVIDIA_API_KEY")
        if not self.api_key or "your_gemini_api_key_here" in self.api_key:
            raise ValueError(
                "NVIDIA_API_KEY not set! Add your key to the .env file."
            )
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=self.api_key
        )
        self.model_name = model_name

    def generate(self, system_prompt: str, user_input: str) -> str:
        """Generates a response from Nvidia with full context."""
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[LLM] Nvidia generate failed: {e}. Trying OpenRouter fallback...")
            full_prompt = f"{system_prompt}\n\n---\nUSER INPUT: {user_input}"
            or_resp = _call_openrouter(full_prompt)
            if or_resp:
                return f"🌐 [OPENROUTER FALLBACK]\n\n{or_resp}"
            return f"[LLM ERROR] Failed to generate response: {e}"

    def generate_with_mode(
        self, system_prompt: str, user_input: str,
        mode: str, mode_instruction: str,
        philosophical_ctx: str, nafs_analysis: dict,
        phase0_status: str,
    ) -> str:
        """
        Generates a response with full context and mode-specific instructions.
        """
        # Build the enriched system prompt
        sys_parts = [
            system_prompt,
            f"\n\n## RESPONSE MODE: {mode}",
            f"MODE INSTRUCTION: {mode_instruction}",
            f"\n## PHASE 0 STATUS\n{phase0_status}",
        ]

        if philosophical_ctx:
            sys_parts.append(f"\n## RELEVANT PHILOSOPHICAL CONTEXT (USER'S OWN WORDS)\n{philosophical_ctx}")

        if nafs_analysis["is_ammorah"]:
            patterns_str = ", ".join(
                f"{cat}: {', '.join(matches)}"
                for cat, matches in nafs_analysis["patterns"].items()
            )
            sys_parts.append(
                f"\n## ⚠️ NAFS AL-AMMORAH DETECTED [Severity: {nafs_analysis['severity']}]\n"
                f"Detected patterns: {patterns_str}\n"
                f"DEPLOY ACCOUNTABILITY. Use the user's own words against their drift."
            )

        full_system_prompt = "\n".join(sys_parts)

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": user_input}
                ],
                max_tokens=2048,
            )
            # Add mode indicator
            mode_icons = {
                "STANDARD": "💬",
                "ACCOUNTABILITY": "⚠️",
                "PHILOSOPHICAL": "🧠",
                "TACTICAL": "🎯",
                "SPIRITUAL": "🕌",
            }
            icon = mode_icons.get(mode, "💬")
            return f"{icon} [{mode} MODE]\n\n{response.choices[0].message.content}"
        except Exception as e:
            print(f"[LLM] Nvidia generate_with_mode failed: {e}. Trying OpenRouter fallback...")
            full_prompt = f"{full_system_prompt}\n\n---\nUSER INPUT: {user_input}"
            or_resp = _call_openrouter(full_prompt)
            if or_resp:
                return f"🌐 [{mode} MODE - OPENROUTER FALLBACK]\n\n{or_resp}"
            return f"[LLM ERROR] Failed to generate response: {e}"

    def analyze_session(self, session_logs: list, current_guardrails: str) -> dict:
        """
        Analyzes a session for the self-improvement loop.
        Returns structured analysis with proposed updates.
        """
        analysis_prompt = (
            "You are analyzing a Virtual Mind session log for patterns and improvements.\n\n"
            f"CURRENT GUARDRAILS:\n{current_guardrails}\n\n"
            f"SESSION LOGS:\n{json.dumps(session_logs, indent=2)}\n\n"
            "Analyze and respond with EXACTLY this JSON format (no markdown, no code fence):\n"
            '{\n'
            '  "patterns_detected": ["list of behavioral patterns"],\n'
            '  "ambition_contradictions": ["any contradictions with stated ambitions"],\n'
            '  "new_insights": ["new worldview insights discovered"],\n'
            '  "guardrail_updates": ["proposed new rules for boundary control"],\n'
            '  "growth_areas": ["areas where the user showed growth"],\n'
            '  "drift_areas": ["areas where drift was detected"],\n'
            '  "overall_assessment": "one paragraph summary"\n'
            '}'
        )
        try:
            response = self.model.generate_content(analysis_prompt)

            return json.loads(response.text.strip())
        except Exception:
            return {
                "patterns_detected": [],
                "ambition_contradictions": [],
                "new_insights": [],
                "guardrail_updates": [],
                "growth_areas": [],
                "drift_areas": [],
                "overall_assessment": "Analysis failed — manual review needed.",
            }


def _call_openrouter(prompt: str) -> str:
    """Internal helper to call OpenRouter (Cloud Llama, etc.)"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return ""
    try:
        import httpx
        model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-70b-instruct")
        response = httpx.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60.0
        )
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"[LLM] OpenRouter fallback failed: {e}")
    return ""


# Singleton LLM instance (initialized lazily)
_llm_instance = None


def _get_llm():
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = NvidiaLLM()
    return _llm_instance


# ─── MAIN PROCESSING PIPELINE ─────────────────────────────────────────────────



def process_input(user_input: str) -> str:
    """
    Processes user input through the full Virtual Mind pipeline.
    Now with 5 response modes, Nafs analysis, and philosophical context.
    """
    # 1. Nafs Filter — Detect drift
    nafs_analysis = NafsFilter.analyze(user_input)

    # 2. Detect Response Mode
    mode = detect_response_mode(user_input, nafs_analysis)
    mode_instruction = RESPONSE_MODES[mode]

    # 3. Get Philosophical Context
    philosophical_ctx = get_philosophical_context(user_input)

    # 4. Get Phase 0 Status
    phase0_status = get_accountability_status()

    # 5. Retrieve Context from Vector Memory
    context = memory_system.query_memory(user_input)
    ambitions = context.get("ambitions", [])
    memories = context.get("memories", [])
    worldview = context.get("worldview", [])

    # 5b. Retrieve Last Sessions Context
    from brain.logger import SessionLogger
    last_sessions = SessionLogger.get_last_sessions(3)
    recent_ctx = "\n".join([f"- [{s['date'].split('T')[0]}] {s['summary']}" for s in last_sessions]) if last_sessions else "No recent session context."

    # Format context blocks
    ambitions_ctx = (
        "\n".join([f"- {a}" for a in ambitions])
        if ambitions
        else "No specific ambitions loaded yet."
    )
    memories_ctx = (
        "\n".join([f"- {m}" for m in memories])
        if memories
        else "No relevant memories found."
    )
    worldview_ctx = (
        "\n".join([f"- {w}" for w in worldview])
        if worldview
        else "No worldview context found."
    )

    # 6. Build the Full System Prompt
    system_prompt = get_system_prompt()
    full_prompt = (
        f"{system_prompt}\n\n"
        f"## RECENT SESSION CONTEXT\n{recent_ctx}\n\n"
        f"## DECISION CONTEXT (HIGHEST PRIORITY)\n{ambitions_ctx}\n\n"
        f"## WORLDVIEW & BELIEFS\n{worldview_ctx}\n\n"
        f"## RELEVANT MEMORIES\n{memories_ctx}"
    )

    # 7. Generate Response via Real LLM with Mode
    llm = _get_llm()
    response = llm.generate_with_mode(
        system_prompt=full_prompt,
        user_input=user_input,
        mode=mode,
        mode_instruction=mode_instruction,
        philosophical_ctx=philosophical_ctx,
        nafs_analysis=nafs_analysis,
        phase0_status=phase0_status,
    )

    # 8. Store the interaction as memory with richer metadata
    memory_system.add_memory(
        f"User: {user_input}",
        metadata={
            "type": "conversation_history",
            "response_mode": mode,
            "nafs_detected": nafs_analysis["is_ammorah"],
            "nafs_severity": nafs_analysis["severity"],
        },
    )

    return response


# ─── STREAMING PIPELINE ───────────────────────────────────────────────────────


async def process_input_streaming(user_input: str):
    """
    Async generator version of process_input.
    Yields text tokens progressively using Gemini's streaming API.
    Falls back to chunked delivery if streaming fails.
    """
    import asyncio

    # 1. NafsFilter
    nafs_analysis = NafsFilter.analyze(user_input)
    mode = detect_response_mode(user_input, nafs_analysis)
    mode_instruction = RESPONSE_MODES[mode]
    philosophical_ctx = get_philosophical_context(user_input)
    phase0_status = get_accountability_status()

    # 2. Memory context
    context = memory_system.query_memory(user_input)
    ambitions = context.get("ambitions", [])
    memories = context.get("memories", [])
    worldview = context.get("worldview", [])

    from brain.logger import SessionLogger
    last_sessions = SessionLogger.get_last_sessions(3)
    recent_ctx = "\n".join([f"- [{s['date'].split('T')[0]}] {s['summary']}" for s in last_sessions]) if last_sessions else "No recent session context."

    ambitions_ctx = "\n".join([f"- {a}" for a in ambitions]) if ambitions else "No specific ambitions loaded yet."
    memories_ctx = "\n".join([f"- {m}" for m in memories]) if memories else "No relevant memories found."
    worldview_ctx = "\n".join([f"- {w}" for w in worldview]) if worldview else "No worldview context found."

    system_prompt = get_system_prompt()
    full_prompt = (
        f"{system_prompt}\n\n"
        f"## RECENT SESSION CONTEXT\n{recent_ctx}\n\n"
        f"## DECISION CONTEXT (HIGHEST PRIORITY)\n{ambitions_ctx}\n\n"
        f"## WORLDVIEW & BELIEFS\n{worldview_ctx}\n\n"
        f"## RELEVANT MEMORIES\n{memories_ctx}"
    )

    # Mode header — yield first so frontend can detect mode immediately
    mode_icons = {"STANDARD": "💬", "ACCOUNTABILITY": "⚠️", "PHILOSOPHICAL": "🧠", "TACTICAL": "🎯", "SPIRITUAL": "🕌"}
    icon = mode_icons.get(mode, "💬")
    header = f"{icon} [{mode} MODE]\n\n"
    yield header
    await asyncio.sleep(0)

    # 3. Build mode-enriched prompt (same as generate_with_mode)
    prompt_parts = [
        full_prompt,
        f"\n\n## RESPONSE MODE: {mode}",
        f"MODE INSTRUCTION: {mode_instruction}",
        f"\n## PHASE 0 STATUS\n{phase0_status}",
    ]
    if philosophical_ctx:
        prompt_parts.append(f"\n## RELEVANT PHILOSOPHICAL CONTEXT (USER'S OWN WORDS)\n{philosophical_ctx}")
    if nafs_analysis["is_ammorah"]:
        patterns_str = ", ".join(
            f"{cat}: {', '.join(matches)}"
            for cat, matches in nafs_analysis["patterns"].items()
        )
        prompt_parts.append(
            f"\n## ⚠️ NAFS AL-AMMORAH DETECTED [Severity: {nafs_analysis['severity']}]\n"
            f"Detected patterns: {patterns_str}\n"
            f"DEPLOY ACCOUNTABILITY. Use the user's own words against their drift."
        )
    prompt_parts.append(f"\n---\n")
    
    # 3.5 Fetch recent chat history to build conversation memory
    from api.database import get_db
    try:
        db = get_db()
        history_cursor = db.chat_history.find({}, {"_id": 0}).sort("timestamp", -1).limit(10)
        chat_hist = list(history_cursor)[::-1]
    except Exception:
        chat_hist = []

    # 4. Stream from NVIDIA
    try:
        llm = _get_llm()
        full_text = header
        
        system_instructions = "\n".join(prompt_parts)
        
        # Build message history
        messages = [{"role": "system", "content": system_instructions}]
        for h in chat_hist:
            if h.get("user"):
                messages.append({"role": "user", "content": h["user"]})
            if h.get("assistant"):
                messages.append({"role": "assistant", "content": h["assistant"]})
        
        messages.append({"role": "user", "content": user_input})

        stream = llm.client.chat.completions.create(
            model=llm.model_name,
            messages=messages,
            stream=True,
            max_tokens=2048,
        )
        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                full_text += token
                yield token
                await asyncio.sleep(0)
    except Exception as e:
        fallback = f"\n[STREAM ERROR: {e}]"
        yield fallback
        full_text = header + fallback

    # 5. Store memory of the interaction
    try:
        memory_system.add_memory(
            f"User: {user_input}",
            metadata={
                "type": "conversation_history",
                "response_mode": mode,
                "nafs_detected": nafs_analysis["is_ammorah"],
                "nafs_severity": nafs_analysis["severity"],
            },
        )
    except Exception:
        pass
