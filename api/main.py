import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

from api.routes.logs import router as logs_router
from api.routes.analysis import router as analysis_router
from api.routes.milestones import router as milestones_router
from api.routes.flaws import router as flaws_router
from api.routes.chat import router as chat_router
from api.routes.sync import router as sync_router
from api.routes.elesium import router as elesium_router
from api.routes.operator import router as operator_router
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
from api.routes.verification import verification_router
from api.routes.evolution import evolution_router
from api.routes.oracle import oracle_router
import scheduler
from brain.ingest import ingest_all
from api.database import get_db

app = FastAPI(
    title="Virtual Mind API",
    description="Backend API for the Virtual Mind Command Center",
    version="2.0"
)

@app.middleware("http")
async def nextjs_rsc_middleware(request: Request, call_next):
    # If this is a Next.js client-side navigation (RSC request) or a direct fetch for a .txt payload
    is_rsc_header = request.headers.get("RSC") == "1"
    is_txt_fetch = request.url.path.endswith(".txt")
    
    if request.method == "GET" and (is_rsc_header or is_txt_fetch):
        path = request.url.path
        if not path.startswith("/api/"):
            import os
            from fastapi.responses import FileResponse
            frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "out")
            
            # If it's a .txt fetch, strip the .txt to get the base path
            if is_txt_fetch:
                base_path = path[:-4].strip("/")
            else:
                base_path = path.strip("/")
                
            if not base_path:
                base_path = "index"
                
            txt_path1 = os.path.join(frontend_dir, f"{base_path}.txt")
            txt_path2 = os.path.join(frontend_dir, base_path, "index.txt")
            
            if os.path.exists(txt_path1):
                return FileResponse(txt_path1, media_type="text/x-component")
            elif os.path.exists(txt_path2):
                return FileResponse(txt_path2, media_type="text/x-component")
                
    # If it's a standard GET request for a path without an extension, serve the HTML directly
    # This prevents Starlette's StaticFiles from issuing a 307 Redirect to add a trailing slash,
    # which completely breaks older Android WebViews.
    if request.method == "GET":
        path = request.url.path
        if not path.startswith("/api/") and not path.startswith("/_next/") and "." not in path.split("/")[-1]:
            import os
            from fastapi.responses import FileResponse
            frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "out")
            base_path = path.strip("/")
            if not base_path:
                base_path = "index"
                
            html_path1 = os.path.join(frontend_dir, f"{base_path}.html")
            html_path2 = os.path.join(frontend_dir, base_path, "index.html")
            
            if os.path.exists(html_path1):
                return FileResponse(html_path1, media_type="text/html")
            elif os.path.exists(html_path2):
                return FileResponse(html_path2, media_type="text/html")
                
    return await call_next(request)

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

app.include_router(logs_router, prefix="/api/logs", tags=["Logs"])
app.include_router(analysis_router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(milestones_router, prefix="/api/milestones", tags=["Milestones"])
app.include_router(flaws_router, prefix="/api/flaws", tags=["Flaws"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(sync_router, prefix="/api/sync", tags=["Sync"])
app.include_router(elesium_router, prefix="/api/elesium", tags=["Elesium"])
app.include_router(operator_router, prefix="/api/operator", tags=["Operator"])
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
app.include_router(verification_router, tags=["Verification"])
app.include_router(evolution_router, tags=["Evolution"])
app.include_router(oracle_router, tags=["Oracle"])

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
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if not gemini_key or gemini_key == "your_gemini_api_key_here":
        print("[WARN] GEMINI_API_KEY not set.")
    else:
        print(f"[INIT] GEMINI_API_KEY found ({gemini_key[:8]}...)")
    try:
        threading.Thread(target=ingest_all, args=(False,), daemon=True).start()
    except Exception as e:
        print(f"[ERROR] Memory ingestion failed: {e}")
    threading.Thread(target=run_scheduler_bg, daemon=True).start()
    print("[INIT] Core systems online.")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "system": "Virtual Mind 2.0 Operational"}

@app.get("/api/system/boot")
async def boot_check():
    import os
    import datetime
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    has_gemini = bool(gemini_key and gemini_key != "your_gemini_api_key_here")
    
    today_str = datetime.date.today().isoformat()
    try:
        db = get_db()
        log_filed = db.daily_logs.find_one({"date": today_str}) is not None
    except Exception:
        log_filed = False
        
    return {
        "status": "operational",
        "gemini_ready": has_gemini,
        "log_filed_today": log_filed,
        "scheduler_running": True,
        "version": "2.0",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

@app.get("/api/status")
async def get_system_status():
    import datetime
    
    xp_balance = 0

    today = datetime.date.today()
    phase_0_start = datetime.date(2026, 2, 22)
    phase_day = max(0, (today - phase_0_start).days)
    
    return {
        "status": "Phase 0 active",
        "phase_day": phase_day,
        "is_locked": False,
        "xp_balance": xp_balance
    }

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "out")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    @app.get("/")
    async def fallback_root():
        return {"detail": "Frontend not built. Please run npm run build in the frontend directory."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
