import time
import urllib.request
import urllib.error
import json
from datetime import date, datetime, timezone, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
LOGS_DIR = PROJECT_ROOT / "data" / "logs"
# The API runs on port 8001 when started via start_mobile.sh (uvicorn on 0.0.0.0:8001)
# Fall back to 8000 for local dev with the simple start script
import os
API_PORT = os.getenv("API_PORT", "8000")
API_BASE = f"http://localhost:{API_PORT}"

BANGALORE_TZ = timezone(timedelta(hours=5, minutes=30))
notified_prayers = set()
last_notified_date = ""

# ── Operator Identity ──────────────────────────────────────────────────────────
OPERATOR_NAME = "Chaman"


def auto_generate_operator_entry():
    print("Triggering 14-day operator log generation...")
    try:
        req = urllib.request.Request(f"{API_BASE}/api/operator/generate", method='POST')
        with urllib.request.urlopen(req) as response:
            print(f"Generation response: {json.loads(response.read().decode())}")
    except Exception as e:
        print(f"Failed to generate operator entry: {e}")


def dispatch_web_push(title: str, body: str, url: str = "/command", require_interaction: bool = True, tag: str = "vm-scheduler"):
    """Sends a native Web Push notification to all subscribers via the API."""
    try:
        data = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "tag": tag,
            "requireInteraction": require_interaction,
        }).encode('utf-8')
        req = urllib.request.Request(f"{API_BASE}/api/push/send", data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode())
            print(f"[SCHEDULER] Push dispatched: {result.get('sent', 0)} devices notified.")
    except Exception as e:
        print(f"[SCHEDULER] Push dispatch failed: {e}")


def check_daily_log_completion():
    today_str = date.today().isoformat()
    log_path = LOGS_DIR / f"{today_str}.json"

    if not log_path.exists():
        print(f"[SCHEDULER] Daily log missing for {today_str}. Dispatching native push alert.")
        dispatch_web_push(
            title="Warning: Virtual Mind Reflection Unsecured",
            body=f"{OPERATOR_NAME}, your daily log for {today_str} is not secured. Reflect now before the day is lost. The Caliphate is built one day at a time.",
            url="/log",
            require_interaction=True,
            tag="vm-daily-log",
        )
    else:
        print(f"[SCHEDULER] Log already secured for today ({today_str}).")


def send_morning_intention():
    """Morning push at Fajr time to set the day's intention."""
    dispatch_web_push(
        title="Virtual Mind Fajr Protocol",
        body=f"Bismillah, {OPERATOR_NAME}. New day, new opportunity to build the Caliphate. What are your non-negotiables today?",
        url="/command",
        require_interaction=False,
        tag="vm-morning",
    )


def check_salah_times():
    """Checks today's prayer times for Bangalore and dispatches personalized alerts."""
    global notified_prayers, last_notified_date
    now_bangalore = datetime.now(BANGALORE_TZ)
    date_str = now_bangalore.strftime("%Y-%m-%d")
    current_time_str = now_bangalore.strftime("%H:%M")

    # Reset notified set daily
    if date_str != last_notified_date:
        notified_prayers.clear()
        last_notified_date = date_str

    try:
        # Load cached times
        cache_path = PROJECT_ROOT / "data" / "prayer_times.json"
        cache = {}
        if cache_path.exists():
            try:
                cache = json.loads(cache_path.read_text())
            except Exception:
                pass

        if date_str not in cache:
            print(f"[SCHEDULER] Cache miss for {date_str}. Fetching from API...")
            try:
                req = urllib.request.Request(f"{API_BASE}/api/deen/prayer-times")
                with urllib.request.urlopen(req, timeout=10) as response:
                    timings_data = json.loads(response.read().decode())
            except Exception as e:
                print(f"[SCHEDULER] Failed to load prayer timings from API: {e}")
                return
        else:
            timings_data = cache[date_str]

        timings = timings_data.get("timings", {})
        prayers_to_check = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

        end_times = {
            "Fajr": timings.get("Sunrise"),
            "Dhuhr": timings.get("Asr"),
            "Asr": timings.get("Maghrib"),
            "Maghrib": timings.get("Isha"),
            "Isha": "23:59"
        }

        # Check today's log for prayers already completed
        today_log_path = LOGS_DIR / f"{date_str}.json"
        prayers_logged = {}
        if today_log_path.exists():
            try:
                log_data = json.loads(today_log_path.read_text())
                prayers_logged = log_data.get("prayers_logged", {})
            except Exception:
                pass

        for prayer in prayers_to_check:
            prayer_time = timings.get(prayer)
            if not prayer_time:
                continue

            # 1. On-time prayer notification (personalized per prayer)
            if current_time_str == prayer_time and prayer not in notified_prayers:
                print(f"[SCHEDULER] Salah time for {prayer} ({prayer_time})! Alerting {OPERATOR_NAME}...")

                prayer_messages = {
                    "Fajr": f"{OPERATOR_NAME}, Fajr is here ({prayer_time}). Rise before the world rises. Your prayer is the foundation of the day.",
                    "Dhuhr": f"{OPERATOR_NAME}, Dhuhr time ({prayer_time}). Pause your work, face the Qibla, and reconnect with Allah.",
                    "Asr": f"{OPERATOR_NAME}, Asr is here ({prayer_time}). The Prophet (SAWS) was most consistent with Asr. Don't miss it.",
                    "Maghrib": f"{OPERATOR_NAME}, Maghrib ({prayer_time}). The sun is setting. Drop everything and pray.",
                    "Isha": f"{OPERATOR_NAME}, Isha time ({prayer_time}). Complete your day with prayer. Then rest — you've earned it.",
                }
                body = prayer_messages.get(prayer, f"{OPERATOR_NAME}, it is time for {prayer} ({prayer_time}). Secure your Deen.")

                dispatch_web_push(
                    title=f"Salah: {prayer} Time ({prayer_time})",
                    body=body,
                    url="/folder/DEEN",
                    require_interaction=True,
                    tag=f"vm-prayer-{prayer.lower()}",
                )
                notified_prayers.add(prayer)

            # 2. Mid-time warning if not yet prayed
            end_time = end_times.get(prayer)
            if prayer_time and end_time:
                try:
                    pt = datetime.strptime(prayer_time, "%H:%M")
                    et = datetime.strptime(end_time, "%H:%M")
                    if et < pt:
                        et += timedelta(days=1)

                    mid_time = pt + (et - pt) / 2
                    mid_time_str = mid_time.strftime("%H:%M")

                    mid_notif_key = f"{prayer}_mid"
                    if current_time_str == mid_time_str and mid_notif_key not in notified_prayers:
                        notified_prayers.add(mid_notif_key)

                        is_prayed = prayers_logged.get(prayer.lower(), False)
                        if not is_prayed:
                            print(f"[SCHEDULER] Mid-time for {prayer}. Not prayed! Alerting {OPERATOR_NAME}...")
                            dispatch_web_push(
                                title=f"Warning: {prayer} Time Is Halfway Gone",
                                body=f"{OPERATOR_NAME}, half the time for {prayer} has passed and you haven't logged it. Every minute of delay is a missed opportunity.",
                                url="/folder/DEEN",
                                require_interaction=True,
                                tag=f"vm-prayer-mid-{prayer.lower()}",
                            )
                except Exception as e:
                    print(f"[SCHEDULER] Error calculating mid-time for {prayer}: {e}")

    except Exception as e:
        print(f"[SCHEDULER] Error checking prayer times: {e}")


def check_hydration_reminder():
    """Fires hydration reminders at 10:00, 14:00, and 18:00 if below goal."""
    try:
        req = urllib.request.Request(f"{API_BASE}/api/wellness/hydration/today")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status != 200:
                return
            data = json.loads(response.read().decode())
        percent = data.get("percent", 100)
        today_L = data.get("today_L", 0)
        goal_L = data.get("goal_L", 3)

        if percent < 50:
            dispatch_web_push(
                title="Hydration Alert - Critical",
                body=f"{OPERATOR_NAME}, you've only had {today_L:.1f}L of your {goal_L}L goal. Drink water NOW. Dehydration kills performance and cognition.",
                url="/wellness",
                require_interaction=False,
                tag="vm-hydration",
            )
        elif percent < 80:
            dispatch_web_push(
                title="Hydration Reminder",
                body=f"{OPERATOR_NAME}, you're at {today_L:.1f}L of {goal_L}L. Keep going — you're close to your goal.",
                url="/wellness",
                require_interaction=False,
                tag="vm-hydration",
            )
        else:
            print(f"[SCHEDULER] Hydration at {percent:.0f}% - no reminder needed.")
    except Exception as e:
        print(f"[SCHEDULER] Hydration check failed: {e}")


def check_fasting_notification():
    """Sends milestone notifications during a fast at the 12h, 16h, 18h, 20h marks."""
    try:
        req = urllib.request.Request(f"{API_BASE}/api/wellness/fast/today")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status != 200:
                return
            data = json.loads(response.read().decode())
        if not data.get("is_fasting", False):
            return

        elapsed_minutes = data.get("elapsed_minutes", 0)
        hours = elapsed_minutes / 60

        milestones = {
            12: ("vm-fast-12h", f"{OPERATOR_NAME}, 12 hours of fasting achieved. Your body has entered ketosis. Stay strong."),
            16: ("vm-fast-16h", f"{OPERATOR_NAME}, 16 hours fasted. Peak autophagy window. Your body is healing itself. Subhanallah."),
            18: ("vm-fast-18h", f"{OPERATOR_NAME}, 18 hours fasted. Exceptional discipline. You're doing what most can't."),
            20: ("vm-fast-20h", f"{OPERATOR_NAME}, 20 hours fasted. Elite-level self-mastery. You're in rare company."),
        }

        for milestone_h, (tag, body) in milestones.items():
            if hours >= milestone_h and hours < milestone_h + 1:
                dispatch_web_push(
                    title=f"Fasting: {milestone_h}h Milestone",
                    body=body,
                    url="/wellness",
                    require_interaction=False,
                    tag=tag,
                )
                break
    except Exception as e:
        print(f"[SCHEDULER] Fasting check failed: {e}")


def check_workout_reminder():
    """Sends a workout reminder if today's session is not logged."""
    try:
        req = urllib.request.Request(f"{API_BASE}/api/workout/today")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status != 200:
                return
            data = json.loads(response.read().decode())

        if data.get("logged", False):
            print("[SCHEDULER] Workout already logged today.")
            return

        workout = data.get("workout", {})
        is_rest_day = workout.get("is_rest_day", False)
        split_name = workout.get("split_name", "Training Session")

        if is_rest_day:
            dispatch_web_push(
                title="Active Recovery Day",
                body=f"{OPERATOR_NAME}, today is your rest day. Walk, stretch, and fuel your body for the next session. Recovery is training.",
                url="/workout",
                require_interaction=False,
                tag="vm-workout-rest",
            )
        else:
            dispatch_web_push(
                title=f"Workout: {split_name} Due Today",
                body=f"{OPERATOR_NAME}, your {split_name} session is not logged yet. The bar is waiting. No excuses, no delays.",
                url="/workout",
                require_interaction=True,
                tag="vm-workout-reminder",
            )
    except Exception as e:
        print(f"[SCHEDULER] Workout check failed: {e}")


def send_sleep_window_alert():
    """Fires at sleep window time to remind user to wind down."""
    dispatch_web_push(
        title="Sleep Window",
        body=f"{OPERATOR_NAME}, time to wind down. Log your reflection, close your screens, and protect your sleep protocol. Tomorrow's performance depends on tonight.",
        url="/wellness/sleep",
        require_interaction=True,
        tag="vm-sleep-window",
    )


def midnight_rollover():
    """Wipes daily transient state precisely at midnight."""
    print(f"[SCHEDULER] 00:00 MIDNIGHT ROLLOVER INITIATED FOR {OPERATOR_NAME}")
    global notified_prayers, last_notified_date
    notified_prayers.clear()
    last_notified_date = ""
    # Ensure fresh cache fetch next time it's asked
    check_salah_times()

# ─── Native Polling Scheduler ────────────────────────────────────────────────────────

def run_scheduler_loop():
    print(f"Virtual Mind Global Scheduler Running for {OPERATOR_NAME}...")
    check_salah_times()
    
    last_run = {}
    
    def should_run(job_name, check_condition):
        today_str = date.today().isoformat()
        last = last_run.get(job_name)
        if check_condition() and last != today_str:
            last_run[job_name] = today_str
            return True
        return False

    while True:
        now = datetime.now()
        h, m = now.hour, now.minute
        
        # Every minute tasks
        check_salah_times()
        
        # Hourly tasks
        if m == 0:
            check_fasting_notification()
            
        # Daily specific times
        if h == 0 and m == 0 and should_run("midnight", lambda: True):
            midnight_rollover()
        if h == 5 and m == 0 and should_run("morning_intent", lambda: True):
            send_morning_intention()
        if h in (10, 14, 18) and m == 0 and should_run(f"hydration_{h}", lambda: True):
            check_hydration_reminder()
        if h == 18 and m == 30 and should_run("workout", lambda: True):
            check_workout_reminder()
        if h in (21, 22) and m == 30 and should_run(f"daily_log_{h}", lambda: True):
            check_daily_log_completion()
        if h == 22 and m == 30 and should_run("sleep_window", lambda: True):
            send_sleep_window_alert()
            
        time.sleep(60)

if __name__ == "__main__":
    run_scheduler_loop()
