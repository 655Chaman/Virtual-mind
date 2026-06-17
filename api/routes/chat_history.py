import os
import json
from fastapi import APIRouter

router = APIRouter()

@router.get("/chat/history")
async def get_chat_history(last: int = 20):
    history_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "logs", "chat_history.jsonl")
    if not os.path.exists(history_path):
        return {"history": []}
        
    try:
        with open(history_path, "r") as f:
            lines = f.readlines()
        
        exchanges = [json.loads(line) for line in lines if line.strip()]
        return {"history": exchanges[-last:]}
    except Exception as e:
        return {"history": [], "error": str(e)}
