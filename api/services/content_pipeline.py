from datetime import datetime
from api.db import get_content_pipeline_collection

async def get_pipeline_status():
    """
    Returns a summary of the current content pipeline queue.
    """
    collection = get_content_pipeline_collection()
    
    # Aggregate counts by status
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    cursor = collection.aggregate(pipeline)
    
    status_counts = {
        "DETECTED": 0,
        "DOWNLOADING": 0,
        "UPLOADING": 0,
        "SCHEDULED": 0,
        "FAILED": 0
    }
    
    async for doc in cursor:
        if doc["_id"] in status_counts:
            status_counts[doc["_id"]] = doc["count"]
            
    # Get the latest 5 items in the queue to show on frontend
    recent_items = []
    items_cursor = collection.find().sort("created_at", -1).limit(5)
    async for item in items_cursor:
        # safely transform ObjectId to string for JSON serialization
        item["_id"] = str(item["_id"])
        recent_items.append(item)
        
    return {
        "status_counts": status_counts,
        "recent_items": recent_items,
        "buffer_health_days": min(7, status_counts["SCHEDULED"]) # rough proxy for UI demo
    }

async def handle_make_webhook_detected(file_id: str, file_name: str):
    """Called by Make.com when a new file is detected in Google Drive."""
    collection = get_content_pipeline_collection()
    await collection.update_one(
        {"drive_file_id": file_id},
        {"$set": {
            "drive_file_id": file_id,
            "file_name": file_name,
            "status": "DETECTED",
            "created_at": datetime.utcnow()
        }},
        upsert=True
    )
    return {"status": "ok"}

async def handle_make_webhook_scheduled(file_id: str, buffer_id: str):
    """Called by Make.com when the file is successfully scheduled in Buffer."""
    collection = get_content_pipeline_collection()
    await collection.update_one(
        {"drive_file_id": file_id},
        {"$set": {
            "status": "SCHEDULED",
            "buffer_id": buffer_id,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"status": "ok"}

async def handle_make_webhook_failed(file_id: str, error_message: str):
    """Called by Make.com if scheduling fails."""
    collection = get_content_pipeline_collection()
    await collection.update_one(
        {"drive_file_id": file_id},
        {"$set": {
            "status": "FAILED",
            "error": error_message,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"status": "ok"}

