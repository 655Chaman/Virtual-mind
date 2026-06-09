import json
from pathlib import Path
from datetime import datetime, timezone, timedelta
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
import sqlite3
from api.routes.logs import NonNegotiables

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
LOGS_DIR = PROJECT_ROOT / "data" / "logs"
DEEN_DB_FILE = PROJECT_ROOT / "data" / "deen.db"

def init_deen_db():
    DEEN_DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DEEN_DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasbih_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            subhanallah INTEGER DEFAULT 0,
            alhamdulillah INTEGER DEFAULT 0,
            allahuakbar INTEGER DEFAULT 0,
            astaghfirullah INTEGER DEFAULT 0,
            total INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

init_deen_db()

class PrayerLogRequest(BaseModel):
    fajr: bool = False
    dhuhr: bool = False
    asr: bool = False
    maghrib: bool = False
    isha: bool = False
    date: str = None

CACHE_FILE = PROJECT_ROOT / "data" / "prayer_times.json"
CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)

BANGALORE_TZ = timezone(timedelta(hours=5, minutes=30))

def load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text())
        except Exception:
            return {}
    return {}

def save_cache(cache_data: dict):
    try:
        CACHE_FILE.write_text(json.dumps(cache_data, indent=2))
    except Exception as e:
        print(f"[DEEN CACHE] Failed to write cache: {e}")

@router.get("/prayer-times")
async def get_prayer_times(latitude: float = None, longitude: float = None):
    """
    Fetches and caches today's prayer timings, including Hijri calendar details.
    Supports GPS latitude/longitude with built-in coordinate lock or falls back to Bangalore.
    Applies safety offsets matching the standard local corrections (Fajr -2m, Sunrise -6m, Asr -1m, Maghrib +5m).
    """
    # 1. Get current date in Bangalore timezone
    now_bangalore = datetime.now(BANGALORE_TZ)
    date_str = now_bangalore.strftime("%Y-%m-%d")
    
    # 2. Compute coordinate-aware cache key to handle travel seamlessly
    if latitude is not None and longitude is not None:
        cache_key = f"{date_str}_{latitude:.2f}_{longitude:.2f}"
    else:
        cache_key = date_str
    
    # 3. Check local cache
    cache = load_cache()
    if cache_key in cache:
        print(f"[DEEN API] Serving cached prayer times for {cache_key}")
        return cache[cache_key]
        
    # 4. Fetch from Aladhan API (Coordinates if supplied, else Bangalore City)
    if latitude is not None and longitude is not None:
        url = f"https://api.aladhan.com/v1/timings/{now_bangalore.strftime('%d-%m-%Y')}"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "method": 1,  # University of Islamic Sciences, Karachi
            "school": 1,  # Hanafi juristic method
            "tune": "0,-2,-6,0,-1,5,0,0,0"  # Exact safety corrections matching local settings
        }
    else:
        url = "https://api.aladhan.com/v1/timingsByCity"
        params = {
            "city": "Bangalore",
            "country": "India",
            "method": 1,  # University of Islamic Sciences, Karachi
            "school": 1,  # Hanafi juristic method
            "tune": "0,-2,-6,0,-1,5,0,0,0"  # Exact safety corrections matching local settings
        }
    
    try:
        print(f"[DEEN API] Fetching live prayer times for {cache_key}...")
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=502, 
                detail=f"Aladhan API returned status code {response.status_code}"
            )
            
        res_json = response.json()
        if res_json.get("code") != 200 or "data" not in res_json:
            raise HTTPException(
                status_code=502, 
                detail="Invalid response structure from Aladhan API"
            )
            
        data = res_json["data"]
        raw_timings = data["timings"]
        
        # Clean timings to only return critical ones
        clean_timings = {
            "Fajr": raw_timings.get("Fajr"),
            "Sunrise": raw_timings.get("Sunrise"),
            "Dhuhr": raw_timings.get("Dhuhr"),
            "Asr": raw_timings.get("Asr"),
            "Maghrib": raw_timings.get("Maghrib"),
            "Isha": raw_timings.get("Isha")
        }
        
        # Parse Hijri details
        hijri_data = data["date"]["hijri"]
        hijri_day = hijri_data.get("day")
        hijri_month = hijri_data.get("month", {}).get("en")
        hijri_year = hijri_data.get("year")
        hijri_readable = f"{hijri_day} {hijri_month} {hijri_year}"
        
        payload = {
            "date": date_str,
            "timings": clean_timings,
            "hijri": hijri_data.get("date"),
            "hijri_readable": hijri_readable,
            "gregorian": data["date"]["gregorian"].get("date"),
            "location_name": data["meta"].get("timezone", "Asia/Kolkata")
        }
        
        # Save to cache
        cache[cache_key] = payload
        save_cache(cache)
        
        return payload
        
    except requests.RequestException as e:
        print(f"[DEEN API] External request failed: {e}")
        # If external request fails but we have ANY last cached timings, return that as safety fallback
        if cache:
            last_cached_key = list(cache.keys())[-1]
            fallback = cache[last_cached_key].copy()
            fallback["warning"] = "Offline Mode: Returning last known timings."
            print(f"[DEEN API] Returning fallback timings from {last_cached_key}")
            return fallback
            
        raise HTTPException(
            status_code=503, 
            detail=f"Failed to fetch prayer times: {str(e)}"
        )

@router.post("/prayers/log")
def log_prayers(req: PrayerLogRequest):
    target_date = req.date if req.date else date.today().isoformat()
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    file_path = LOGS_DIR / f"{target_date}.json"
    
    log_data = {}
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                log_data = json.load(f)
        except Exception:
            pass
            
    if not log_data:
        log_data = {
            "date": target_date,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "text": "Auto-created log for prayer update.",
            "pillars": ["DEEN"],
            "non_negotiables": NonNegotiables().model_dump()
        }
        
    prayers_dict = {k: v for k, v in req.model_dump().items() if k != "date"}
    log_data["prayers_logged"] = prayers_dict
    
    # Auto-toggle salah_5 if all are true
    all_prayers = all([req.fajr, req.dhuhr, req.asr, req.maghrib, req.isha])
    if "non_negotiables" not in log_data:
        log_data["non_negotiables"] = {}
    log_data["non_negotiables"]["salah_5"] = all_prayers
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(log_data, f, indent=2)
        
    return {"success": True, "prayers_logged": prayers_dict}

@router.get("/prayers/history")
def get_prayer_history(days: int = 14):
    today = date.today()
    start_date = today - timedelta(days=days-1)
    
    history = []
    
    for i in range(days):
        d = start_date + timedelta(days=i)
        d_str = d.isoformat()
        file_path = LOGS_DIR / f"{d_str}.json"
        
        prayers = {
            "fajr": False,
            "dhuhr": False,
            "asr": False,
            "maghrib": False,
            "isha": False
        }
        count = 0
        
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    
                    if "prayers_logged" in data:
                        prayers = data["prayers_logged"]
                        count = sum(1 for v in prayers.values() if v)
                    else:
                        # Legacy fallback: if salah_5 is true, assume 5/5
                        if data.get("non_negotiables", {}).get("salah_5"):
                            prayers = {k: True for k in prayers}
                            count = 5
            except Exception:
                pass
                
        history.append({
            "date": d_str,
            "prayers": prayers,
            "count": count
        })
        
    return history

class TasbihLogRequest(BaseModel):
    subhanallah: int = 0
    alhamdulillah: int = 0
    allahuakbar: int = 0
    astaghfirullah: int = 0
    total: int = 0

@router.post("/tasbih")
def log_tasbih(req: TasbihLogRequest):
    today_str = date.today().isoformat()
    now_str = datetime.now(timezone.utc).isoformat()
    
    conn = sqlite3.connect(DEEN_DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO tasbih_logs (date, timestamp, subhanallah, alhamdulillah, allahuakbar, astaghfirullah, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (today_str, now_str, req.subhanallah, req.alhamdulillah, req.allahuakbar, req.astaghfirullah, req.total))
    conn.commit()
    log_id = cursor.lastrowid
    conn.close()
    
    return {"success": True, "id": log_id, "data": req.model_dump()}

@router.get("/tasbih")
def get_tasbih_history():
    today_str = date.today().isoformat()
    conn = sqlite3.connect(DEEN_DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get total for today
    cursor.execute('SELECT SUM(total) as today_total FROM tasbih_logs WHERE date = ?', (today_str,))
    today_row = cursor.fetchone()
    today_total = today_row['today_total'] if today_row['today_total'] else 0
    
    # Get last 10 entries
    cursor.execute('SELECT * FROM tasbih_logs ORDER BY id DESC LIMIT 10')
    rows = cursor.fetchall()
    history = [dict(row) for row in rows]
    
    # Get all time total
    cursor.execute('SELECT SUM(total) as all_time FROM tasbih_logs')
    all_time_row = cursor.fetchone()
    all_time_total = all_time_row['all_time'] if all_time_row['all_time'] else 0
    
    conn.close()
    
    return {
        "today_total": today_total,
        "all_time_total": all_time_total,
        "history": history
    }
