import os
import random
from datetime import date, datetime, timedelta
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).parent))

from api.database import get_db

def seed_wellness_data():
    db = get_db()

    today = date.today()
    days_to_seed = 30

    print("Seeding wellness data for the last 30 days...")

    for i in range(days_to_seed, -1, -1):
        target_date = today - timedelta(days=i)
        target_date_str = target_date.isoformat()
        
        # 1. Sleep
        # Sleep usually starts the night before
        sleep_start = datetime(target_date.year, target_date.month, target_date.day, 22, random.randint(0, 59)) - timedelta(days=1)
        sleep_duration_hours = random.uniform(5.5, 8.5)
        sleep_duration_minutes = sleep_duration_hours * 60
        sleep_end = sleep_start + timedelta(minutes=sleep_duration_minutes)
        
        db.sleep_logs.insert_one({
            "start_time": sleep_start.isoformat() + "Z",
            "end_time": sleep_end.isoformat() + "Z",
            "duration_minutes": sleep_duration_minutes
        })
        
        # 2. Fasting
        # Usually from 8 PM the night before to 12 PM next day (16 hours)
        fast_start = datetime(target_date.year, target_date.month, target_date.day, 20, random.randint(0, 30)) - timedelta(days=1)
        fast_duration_hours = random.uniform(13.5, 18.5)
        fast_duration_minutes = fast_duration_hours * 60
        fast_end = fast_start + timedelta(minutes=fast_duration_minutes)
        
        db.fast_logs.insert_one({
            "start_time": fast_start.isoformat() + "Z",
            "end_time": fast_end.isoformat() + "Z",
            "duration_minutes": fast_duration_minutes,
            "goal_minutes": 960
        })

        # 3. Hydration
        # 3-5 liters a day
        daily_ml = random.randint(3000, 5500)
        db.hydration_logs.insert_one({
            "date": target_date_str,
            "amount_ml": daily_ml,
            "logged_at": datetime(target_date.year, target_date.month, target_date.day, 12, 0).isoformat() + "Z"
        })

        # 4. Readiness
        energy = random.randint(3, 5)
        clarity = random.randint(3, 5)
        mood = random.randint(3, 5)
        score = energy + clarity + mood
        db.readiness_logs.insert_one({
            "date": target_date_str,
            "energy": energy,
            "clarity": clarity,
            "mood": mood,
            "score": score
        })

    print("Successfully seeded 30 days of Sleep, Fasting, Hydration, and Readiness data!")

if __name__ == "__main__":
    seed_wellness_data()
