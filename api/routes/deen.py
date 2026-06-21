from pathlib import Path
from datetime import datetime, timezone, timedelta, date
import urllib.request
import urllib.parse
import urllib.error
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.database import get_db

router = APIRouter()

BANGALORE_TZ = timezone(timedelta(hours=5, minutes=30))

class PrayerLogRequest(BaseModel):
    fajr: bool = False
    dhuhr: bool = False
    asr: bool = False
    maghrib: bool = False
    isha: bool = False
    date: str = None

@router.get("/prayer-times")
async def get_prayer_times(latitude: float = None, longitude: float = None):
    now_bangalore = datetime.now(BANGALORE_TZ)
    date_str = now_bangalore.strftime("%Y-%m-%d")
    
    if latitude is not None and longitude is not None:
        cache_key = f"{date_str}_{latitude:.2f}_{longitude:.2f}"
    else:
        cache_key = date_str
    
    db = get_db()
    cached = db.prayer_cache.find_one({"_id": cache_key})
    if cached:
        print(f"[DEEN API] Serving cached prayer times for {cache_key}")
        return cached["data"]
        
    if latitude is not None and longitude is not None:
        url = f"https://api.aladhan.com/v1/timings/{now_bangalore.strftime('%d-%m-%Y')}"
        params = {
            "latitude": latitude, "longitude": longitude,
            "method": 1, "school": 1,
            "tune": "0,-2,-6,0,-1,5,0,0,0"
        }
    else:
        url = "https://api.aladhan.com/v1/timingsByCity"
        params = {
            "city": "Shivamogga", "country": "India",
            "method": 1, "school": 1,
            "tune": "0,-2,-6,0,-1,5,0,0,0"
        }
    
    try:
        query_string = urllib.parse.urlencode(params)
        full_url = f"{url}?{query_string}"
        req = urllib.request.Request(full_url, headers={'User-Agent': 'VirtualMind/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            res_json = json.loads(response.read().decode())
        
        data = res_json["data"]
        raw_timings = data["timings"]
        
        clean_timings = {
            "Fajr": raw_timings.get("Fajr"),
            "Sunrise": raw_timings.get("Sunrise"),
            "Dhuhr": raw_timings.get("Dhuhr"),
            "Asr": raw_timings.get("Asr"),
            "Maghrib": raw_timings.get("Maghrib"),
            "Isha": raw_timings.get("Isha")
        }
        
        hijri_data = data["date"]["hijri"]
        hijri_readable = f"{hijri_data.get('day')} {hijri_data.get('month', {}).get('en')} {hijri_data.get('year')}"
        
        payload = {
            "date": date_str,
            "timings": clean_timings,
            "hijri": hijri_data.get("date"),
            "hijri_readable": hijri_readable,
            "gregorian": data["date"]["gregorian"].get("date"),
            "location_name": data["meta"].get("timezone", "Asia/Kolkata")
        }
        
        db.prayer_cache.update_one({"_id": cache_key}, {"$set": {"data": payload}}, upsert=True)
        return payload
        
    except urllib.error.URLError as e:
        last_cache = db.prayer_cache.find_one({}, sort=[("_id", -1)])
        if last_cache:
            fallback = last_cache["data"].copy()
            fallback["warning"] = "Offline Mode"
            return fallback
            
        # Hardcoded fallback to ensure the UI and graph still render
        print(f"[DEEN API] Critical fallback needed. Aladhan failed: {e}")
        return {
            "date": date_str,
            "timings": {
                "Fajr": "05:15",
                "Sunrise": "06:30",
                "Dhuhr": "12:30",
                "Asr": "15:45",
                "Maghrib": "18:30",
                "Isha": "19:45"
            },
            "hijri": "Unknown",
            "hijri_readable": "Offline Mode",
            "gregorian": date_str,
            "location_name": "Fallback (Offline)",
            "warning": "Critical Offline Mode"
        }

@router.post("/prayers/log")
def log_prayers(req: PrayerLogRequest):
    target_date = req.date if req.date else date.today().isoformat()
    db = get_db()
    
    daily_log = db.daily_logs.find_one({"date": target_date})
    if not daily_log:
        daily_log = {
            "date": target_date,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "text": "Auto-created log for prayer update.",
            "pillars": ["DEEN"],
            "non_negotiables": {}
        }
        
    prayers_dict = {k: v for k, v in req.model_dump().items() if k != "date"}
    daily_log["prayers_logged"] = prayers_dict
    
    all_prayers = all([req.fajr, req.dhuhr, req.asr, req.maghrib, req.isha])
    if "non_negotiables" not in daily_log:
        daily_log["non_negotiables"] = {}
    daily_log["non_negotiables"]["salah_5"] = all_prayers
    
    db.daily_logs.update_one({"date": target_date}, {"$set": daily_log}, upsert=True)
    return {"success": True, "prayers_logged": prayers_dict}

@router.get("/prayers/history")
def get_prayer_history(days: int = 14):
    today = date.today()
    start_date = (today - timedelta(days=days-1)).isoformat()
    
    db = get_db()
    rows = list(db.daily_logs.find({"date": {"$gte": start_date}}))
    logs_by_date = {r["date"]: r for r in rows}
    
    history = []
    for i in range(days):
        d_str = (today - timedelta(days=days-1-i)).isoformat()
        
        prayers = {"fajr": False, "dhuhr": False, "asr": False, "maghrib": False, "isha": False}
        count = 0
        
        if d_str in logs_by_date:
            data = logs_by_date[d_str]
            if "prayers_logged" in data:
                prayers = data["prayers_logged"]
                count = sum(1 for v in prayers.values() if v)
            elif data.get("non_negotiables", {}).get("salah_5"):
                prayers = {k: True for k in prayers}
                count = 5
                
        history.append({"date": d_str, "prayers": prayers, "count": count})
        
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
    db = get_db()
    
    doc = req.model_dump()
    doc["date"] = today_str
    doc["timestamp"] = now_str
    
    res = db.tasbih_logs.insert_one(doc)
    return {"success": True, "id": str(res.inserted_id), "data": doc}

@router.get("/tasbih")
def get_tasbih_history():
    today_str = date.today().isoformat()
    db = get_db()
    
    today_agg = list(db.tasbih_logs.aggregate([
        {"$match": {"date": today_str}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]))
    today_total = today_agg[0]["total"] if today_agg else 0
    
    all_time_agg = list(db.tasbih_logs.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]))
    all_time_total = all_time_agg[0]["total"] if all_time_agg else 0
    
    history = list(db.tasbih_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(10))
    
    return {
        "today_total": today_total,
        "all_time_total": all_time_total,
        "history": history
    }
