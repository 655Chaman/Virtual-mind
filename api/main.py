from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import threading
import time
try:
    import schedule
except ImportError:
    class MockSchedule:
        def run_pending(self): pass
        def every(self, *args, **kwargs): return self
        def day(self, *args, **kwargs): return self
        def at(self, *args, **kwargs): return self
        def do(self, *args, **kwargs): return self
    schedule = MockSchedule()

# Import all routers
from api.routes.logs import router as logs_router
from api.routes.analysis import router as analysis_router
from api.routes.milestones import router as milestones_router
from api.routes.flaws import router as flaws_router
from api.routes.chat import router as chat_router
from api.routes.sync import router as sync_router
from api.routes.elesium import router as elesium_router
from api.routes.operator import router as operator_router
from api.routes.xp import router as xp_router
from api.routes.aos import router as aos_router
from api.routes.history import router as history_router
from api.routes.push import router as push_router
from api.routes.workout import router as workout_router
from api.routes.health import router as health_router
from api.routes.media import router as media_router
from api.routes.deen import router as deen_router
from api.routes.sleep_protocol import router as sleep_protocol_router
from api.routes.qadr import router as qadr_router
from api.routes.graveyard import router as graveyard_router
from api.routes.newspaper import router as newspaper_router
import scheduler
from brain.ingest import ingest_all

app = FastAPI(
    title="Virtual Mind API",
    description="Backend API for the Virtual Mind Command Center",
    version="2.0"
)

# Custom dynamic CORS middleware to prevent preflight OPTIONS 400 Bad Request
@app.middleware("http")
async def dynamic_cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=204)
    else:
        response = await call_next(request)
        
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        
    if request.method == "OPTIONS":
        response.headers["Access-Control-Max-Age"] = "86400"
        
    return response

# Register routers
app.include_router(logs_router, prefix="/api/logs", tags=["Logs"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(milestones_router, prefix="/api/milestones", tags=["Milestones"])
app.include_router(flaws_router, prefix="/api/flaws", tags=["Flaws"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(sync_router, prefix="/api/sync", tags=["Sync"])
app.include_router(elesium_router, prefix="/api/elesium", tags=["Elesium"])
app.include_router(operator_router, prefix="/api/operator", tags=["Operator"])
app.include_router(xp_router, prefix="/api/xp", tags=["XP Engine"])
app.include_router(aos_router, prefix="/api/aos", tags=["A.O.S. Protocols"])
app.include_router(history_router, prefix="/api/history", tags=["History"])
app.include_router(push_router, prefix="/api/push", tags=["Push Notifications"])
app.include_router(workout_router, prefix="/api/workout", tags=["Workout"])
app.include_router(health_router, prefix="/api/wellness", tags=["Wellness"])
app.include_router(media_router, prefix="/api/media", tags=["Media"])
app.include_router(deen_router, prefix="/api/deen", tags=["Deen"])
app.include_router(sleep_protocol_router, prefix="/api/sleep-protocol", tags=["Sleep Protocol"])
app.include_router(qadr_router, prefix="/api/qadr", tags=["Qadr Protocol"])
app.include_router(graveyard_router, prefix="/api/graveyard", tags=["Graveyard"])
app.include_router(newspaper_router, prefix="/api/newspaper", tags=["Newspaper"])

import os
from fastapi.staticfiles import StaticFiles
MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

def run_scheduler_bg():
    print("Virtual Mind Global Scheduler Running in background...")
    while True:
        schedule.run_pending()
        time.sleep(60)

@app.on_event("startup")
async def startup_event():
    import os
    print("Virtual Mind System Booting...")
    # 1. Validate critical environment variables
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key or gemini_key == "your_gemini_api_key_here":
        print("[WARN] GEMINI_API_KEY not set — LLM chat will fail. Set it in .env")
    else:
        print(f"[INIT] GEMINI_API_KEY found ({gemini_key[:8]}...)")
    # 2. Load context files
    print("[INIT] Loading decision_context.md and flaws.md...")
    try:
        # Run ingestion in a separate thread to avoid blocking the event loop on boot
        threading.Thread(target=ingest_all, args=(False,), daemon=True).start()
    except Exception as e:
        print(f"[ERROR] Memory ingestion failed: {e}")
    # 3. Check lock status
    print("[INIT] Verifying system lock status...")
    # 4. Start scheduler
    threading.Thread(target=run_scheduler_bg, daemon=True).start()
    print("[INIT] Core systems online.")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "system": "Virtual Mind 2.0 Operational"}

@app.get("/api/system/boot")
async def boot_check():
    """Returns all system health checks in one call for the frontend."""
    import os
    import datetime
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    has_gemini = bool(gemini_key and gemini_key != "your_gemini_api_key_here")
    
    logs_dir = os.path.join(os.path.dirname(__file__), "..", "data", "logs")
    logs_dir = os.path.normpath(logs_dir)
    today_str = datetime.date.today().isoformat()
    log_path = os.path.join(logs_dir, f"{today_str}.json")
    
    return {
        "status": "operational",
        "gemini_ready": has_gemini,
        "log_filed_today": os.path.exists(log_path),
        "scheduler_running": True,
        "version": "2.0",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

@app.get("/api/status")
async def get_system_status():
    import os
    import datetime
    logs_dir = os.path.join(os.path.dirname(__file__), "data", "logs")
    today = datetime.date.today()
    yesterday_str = (today - datetime.timedelta(days=1)).isoformat()
    today_str = today.isoformat()
    log_path = os.path.join(logs_dir, f"{today_str}.json")
    
    from brain.xp_engine import compute_today_xp
    xp_data = compute_today_xp()
    xp_balance = xp_data.get("total_xp", 0)

    # TEMPORARY: Allow access for development
    is_locked = False

    phase_0_start = datetime.date(2026, 2, 22)
    phase_day = max(0, (today - phase_0_start).days)
    
    return {
        "status": "Phase 0 active",
        "phase_day": phase_day,
        "is_locked": is_locked,
        "xp_balance": xp_balance
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
