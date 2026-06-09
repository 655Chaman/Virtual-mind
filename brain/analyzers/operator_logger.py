import os
import re
import json
import datetime
from anthropic import Anthropic

def get_anthropic_client():
    return Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def generate_operator_entry(logs_last_14_days: list) -> str:
    client = get_anthropic_client()
    
    summary = get_operator_log_summary()
    existing_patterns = summary.get("patterns", [])
    
    system_prompt = """You are the observer module of Virtual Mind. You track behavioral patterns in Chaman Shah's logs with clinical precision.

Your output format matches this existing operator log entry exactly:
## 📅 {DATE}
### Observed Patterns
| # | Pattern | Category | Context |
|---|---------|----------|---------|
| 1 | **pattern name** | Category | Detailed context |

### Commitments Made
(only if found in recent logs)

### Key Quotes
(direct quotes from his logs)

### Growth Signals
(genuine positives, no padding)

### Risk Flags
(behavioral risks, honest)

Return ONLY the markdown entry. No preamble."""

    today_str = datetime.date.today().strftime("%-d %B %Y")
    
    user_prompt = f"Here are 14 days of logs: {json.dumps(logs_last_14_days)}. Existing patterns to watch: {existing_patterns}. Generate the next operator log entry. Replace {{DATE}} with {today_str}."
    
    response = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=2500,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )
    
    return response.content[0].text

def append_to_operator_log(entry: str) -> None:
    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "operator_log.md")
    if not os.path.exists(filepath):
        print("Operator log not found")
        return
        
    with open(filepath, "r") as f:
        content = f.read()
        
    marker = "<!-- NEW ENTRIES GO ABOVE THIS LINE -->"
    if marker in content:
        new_content = content.replace(marker, f"{entry}\n\n{marker}")
        with open(filepath, "w") as f:
            f.write(new_content)
    else:
        with open(filepath, "a") as f:
            f.write(f"\n\n{entry}\n\n{marker}")

def get_operator_log_summary() -> dict:
    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "operator_log.md")
    if not os.path.exists(filepath):
        return {"dates": [], "patterns": [], "risk_flags": []}
        
    with open(filepath, "r") as f:
        content = f.read()
        
    dates = re.findall(r"## 📅 (.*)", content)
    patterns = re.findall(r"\|\s*\d+\s*\|\s*\*\*(.*?)\*\*", content)
    
    risk_flags = []
    in_risks = False
    for line in content.split("\n"):
        if line.startswith("### Risk Flags"):
            in_risks = True
            continue
        elif line.startswith("###") or line.startswith("##") or line.startswith("---"):
            if in_risks:
                in_risks = False
        
        if in_risks and line.strip().startswith("- "):
            risk_flags.append(line.strip()[2:])
            
    return {
        "dates": dates,
        "patterns": patterns,
        "risk_flags": risk_flags
    }
