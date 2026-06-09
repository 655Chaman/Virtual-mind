import os
import json
from datetime import datetime
import anthropic

PATTERNS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "patterns")

SYSTEM_PROMPT = """You are the Virtual Mind — the internal operating system of Chaman Shah, a 21-year-old building Elesium (B2B AI sales startup) with a supreme directive to change the global perception of Islam through excellence.

You have intimate knowledge of his 12 documented flaws:
1. Confuses preparation with progress
2. Terrified of being ordinary
3. Uses escape hatches under pressure
4. Intellectualizes emotions instead of feeling them
5. Treats relationships as systems to optimize
6. Extremism in application (all or nothing)
7. Arrogance masked as intense clarity
8. Needs external friction to move
9. Avoids the boring work
10. Tries to play God with timelines
11. Creates artificial complexity
12. Forgets he is human

And his core pillars: DEEN, ELESIUM, INFLUENCE, SELF.

Your task is to review the last 7 days of operator logs and act as an "unfiltered mirror."

OUTPUT STRICT JSON WITH THIS SCHEMA:
{
  "summary": "1-2 brutal sentences summarizing the week's reality.",
  "flaw_appearances": [
    { "flaw": "Name of flaw", "evidence": "What he did", "severity": 1-10 }
  ],
  "pillar_focus": {
    "DEEN": "score 1-10 and brief reality check",
    "ELESIUM": "score 1-10 and brief reality check",
    "INFLUENCE": "score 1-10 and brief reality check",
    "SELF": "score 1-10 and brief reality check"
  },
  "directive": "One non-negotiable action for the next 7 days based on findings."
}"""

def analyze_week(logs: list[dict]) -> dict:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"error": "ANTHROPIC_API_KEY environment variable not set."}
        
    client = anthropic.Anthropic(api_key=api_key)
    
    logs_formatted = json.dumps(logs, indent=2)
    user_prompt = f"Here are the operator logs for the last 7 days:\n\n{logs_formatted}\n\nAnalyze them according to your system prompt instructions."
    
    try:
        response = client.messages.create(
            # Using the latest Claude 3.5 Sonnet as requested by equivalent instruction
            model="claude-3-5-sonnet-20241022",
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            max_tokens=2000,
            temperature=0.2
        )
        
        content = response.content[0].text.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "", 1)
        if content.endswith("```"):
            content = content.rsplit("```", 1)[0]
        return json.loads(content.strip())
    except Exception as e:
        print(f"Error parsing Anthropic response: {e}")
        return {"error": f"Failed to parse analysis: {str(e)}"}

def get_latest_analysis() -> dict:
    latest_path = os.path.join(PATTERNS_DIR, "latest.json")
    if os.path.exists(latest_path):
        try:
            with open(latest_path, "r") as f:
                return json.load(f)
        except Exception as e:
            return {"analyzed": False, "error": str(e)}
    return {"analyzed": False}

def save_analysis(analysis: dict) -> None:
    os.makedirs(PATTERNS_DIR, exist_ok=True)
    analysis["timestamp"] = datetime.now().isoformat()
    analysis["analyzed"] = True
    
    iso_cal = datetime.now().isocalendar()
    year, week = iso_cal[0], iso_cal[1]
    weekly_path = os.path.join(PATTERNS_DIR, f"{year}-W{week:02d}.json")
    latest_path = os.path.join(PATTERNS_DIR, "latest.json")
    
    with open(weekly_path, "w") as f:
        json.dump(analysis, f, indent=2)
        
    with open(latest_path, "w") as f:
        json.dump(analysis, f, indent=2)

def should_analyze() -> bool:
    latest = get_latest_analysis()
    if not latest.get("analyzed", False):
        return True
    
    last_analyzed = latest.get("timestamp")
    if not last_analyzed:
        return True
        
    try:
        last_date = datetime.fromisoformat(last_analyzed)
        if (datetime.now() - last_date).days > 6:
            return True
    except Exception:
        return True
        
    return False
