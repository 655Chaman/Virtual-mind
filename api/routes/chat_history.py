import os
import json
from fastapi import APIRouter

router = APIRouter()

@router.get("/chat/history")
async def get_chat_history(last: int = 20):
    from api.db import get_async_client
    try:
        col = get_async_client()["virtual_mind"]["chat_history"]
        cursor = col.find({}, {"_id": 0}).sort("timestamp", 1)
        exchanges = await cursor.to_list(length=last)
        return {"history": exchanges}
    except Exception as e:
        return {"history": [], "error": str(e)}
