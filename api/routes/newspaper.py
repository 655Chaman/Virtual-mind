import os
from datetime import date
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from brain.llm import _get_llm

router = APIRouter()

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "newspaper")

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def get_today_file():
    today = date.today().isoformat()
    return os.path.join(DATA_DIR, f"{today}.md")

def generate_newspaper_task():
    llm = _get_llm()
    prompt = """You are the editor of the "Virtual Mind Daily", a niche, high-end, self-improvement newspaper.
Write a long-form, intense, philosophical, and tactical article for the user. 
The user is a 21-year-old entrepreneur building a startup called Elesium. 
Include sections:
1. THE DAILY STOIC / PHILOSOPHY (Deep reflection on life, death, or time).
2. TACTICAL BRIEF (One high-leverage business or outreach tactic).
3. THE MIRROR (Call out potential laziness or comfort).
Format beautifully in Markdown. Make it punchy. No generic self-help fluff."""
    
    try:
        response = llm.model.generate_content(prompt)
        content = response.text
        with open(get_today_file(), "w") as f:
            f.write(content)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Failed to generate newspaper: {e}")

@router.get("/")
def get_newspaper():
    today_file = get_today_file()
    if not os.path.exists(today_file):
        # Return a placeholder if it doesn't exist yet
        return {"content": "## Printing Press is running...\n\nYour daily newspaper is currently being written. Check back in a few minutes.", "status": "generating"}
    
    with open(today_file, "r") as f:
        content = f.read()
    return {"content": content, "status": "ready"}

@router.post("/generate")
def force_generate(background_tasks: BackgroundTasks):
    background_tasks.add_task(generate_newspaper_task)
    return {"status": "generation_started"}
