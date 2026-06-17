import json
import time
import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from api.database import get_db

router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    context_mode: str = "full"

@router.post("/chat")
async def send_chat(msg: ChatMessage):
    async def event_generator():
        full_response = ""
        try:
            from brain.llm import process_input_streaming
            async for token in process_input_streaming(msg.message):
                full_response += token
                yield f"data: {json.dumps({'text': token})}\n\n"
                await asyncio.sleep(0)
        except ImportError:
            try:
                from brain.llm import process_input
                full_response = process_input(msg.message)
                chunk_size = 50
                for i in range(0, len(full_response), chunk_size):
                    chunk = full_response[i:i + chunk_size]
                    yield f"data: {json.dumps({'text': chunk})}\n\n"
                    await asyncio.sleep(0.02)
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                return
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            return

        if full_response:
            try:
                db = get_db()
                db.chat_history.insert_one({
                    "timestamp": time.time(),
                    "user": msg.message,
                    "assistant": full_response,
                })
            except Exception as insert_err:
                try:
                    import os
                    os.makedirs("logs", exist_ok=True)
                    with open("logs/chat_fallback.jsonl", "a", encoding="utf-8") as f:
                        f.write(json.dumps({
                            "timestamp": time.time(),
                            "user": msg.message,
                            "assistant": full_response,
                            "error": str(insert_err)
                        }) + "\n")
                except Exception:
                    pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@router.get("/history")
async def get_chat_history(limit: int = 20):
    try:
        db = get_db()
        cursor = db.chat_history.find({}, {"_id": 0}).sort("timestamp", 1).limit(limit)
        return list(cursor)
    except Exception:
        return []
