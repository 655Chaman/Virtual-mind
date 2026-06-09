import os
import json
import time
import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import StreamingResponse

router = APIRouter()


class ChatMessage(BaseModel):
    message: str
    context_mode: str = "full"


def _get_history_path() -> str:
    base = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "logs")
    os.makedirs(base, exist_ok=True)
    return os.path.join(base, "chat_history.jsonl")


@router.post("/chat")
async def send_chat(msg: ChatMessage):
    """
    Streams the Virtual Mind response via Server-Sent Events.
    Uses the full LLM pipeline: NafsFilter → Mode Detection → Gemini → Memory Store.
    """
    async def event_generator():
        full_response = ""
        try:
            # Import here to avoid circular imports at module level
            from brain.llm import process_input_streaming

            # stream=True path: yield tokens as they arrive
            async for token in process_input_streaming(msg.message):
                full_response += token
                yield f"data: {json.dumps({'text': token})}\n\n"
                await asyncio.sleep(0)  # yield control back to event loop

        except ImportError:
            # Fallback: process_input_streaming not yet available, use blocking
            try:
                from brain.llm import process_input
                full_response = process_input(msg.message)
                # Chunk the response for a smoother feel (50-char chunks)
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

        # Persist to chat history after full response
        if full_response:
            try:
                history_path = _get_history_path()
                with open(history_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps({
                        "timestamp": time.time(),
                        "user": msg.message,
                        "assistant": full_response,
                    }) + "\n")
            except Exception:
                pass  # Non-critical

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history")
async def get_chat_history(limit: int = 20):
    """Returns the last N chat exchanges."""
    history_path = _get_history_path()
    if not os.path.exists(history_path):
        return []
    try:
        with open(history_path, "r", encoding="utf-8") as f:
            lines = [json.loads(l) for l in f if l.strip()]
        return lines[-limit:]
    except Exception:
        return []

