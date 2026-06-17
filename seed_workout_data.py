import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from datetime import date, timedelta
from api.database import get_db

db = get_db()

today = date.today()

# Clear existing test data
db.workouts.delete_many({})

# Day 1: Heavy Chest / Push
day1 = {
    "date": today.isoformat(),
    "day_name": "Monday",
    "split_name": "Chest & Triceps Power",
    "is_rest_day": False,
    "duration_minutes": 85,
    "exercises": [
        {"exercise_name": "Bench Press", "sets": [
            {"set_number": 1, "weight": 100, "reps": 10, "completed": True},
            {"set_number": 2, "weight": 100, "reps": 8, "completed": True},
            {"set_number": 3, "weight": 100, "reps": 8, "completed": True}
        ]},
        {"exercise_name": "Incline Dumbbell Press", "sets": [
            {"set_number": 1, "weight": 40, "reps": 12, "completed": True},
            {"set_number": 2, "weight": 40, "reps": 10, "completed": True}
        ]},
        {"exercise_name": "Tricep Pushdowns", "sets": [
            {"set_number": 1, "weight": 30, "reps": 15, "completed": True},
            {"set_number": 2, "weight": 30, "reps": 15, "completed": True}
        ]}
    ]
}

# Day -2: Back / Pull
day2 = {
    "date": (today - timedelta(days=2)).isoformat(),
    "day_name": "Saturday",
    "split_name": "Back & Biceps Hypertrophy",
    "is_rest_day": False,
    "duration_minutes": 70,
    "exercises": [
        {"exercise_name": "Pullups", "sets": [
            {"set_number": 1, "weight": 85, "reps": 12, "completed": True},
            {"set_number": 2, "weight": 85, "reps": 10, "completed": True}
        ]},
        {"exercise_name": "Barbell Rows", "sets": [
            {"set_number": 1, "weight": 80, "reps": 10, "completed": True},
            {"set_number": 2, "weight": 80, "reps": 10, "completed": True}
        ]},
        {"exercise_name": "Bicep Curls", "sets": [
            {"set_number": 1, "weight": 20, "reps": 15, "completed": True},
            {"set_number": 2, "weight": 20, "reps": 12, "completed": True}
        ]}
    ]
}

# Day -4: Legs
day3 = {
    "date": (today - timedelta(days=4)).isoformat(),
    "day_name": "Thursday",
    "split_name": "Leg Day Protocol",
    "is_rest_day": False,
    "duration_minutes": 95,
    "exercises": [
        {"exercise_name": "Barbell Squats", "sets": [
            {"set_number": 1, "weight": 140, "reps": 8, "completed": True},
            {"set_number": 2, "weight": 140, "reps": 8, "completed": True},
            {"set_number": 3, "weight": 140, "reps": 6, "completed": True}
        ]},
        {"exercise_name": "Romanian Deadlifts", "sets": [
            {"set_number": 1, "weight": 120, "reps": 10, "completed": True},
            {"set_number": 2, "weight": 120, "reps": 10, "completed": True}
        ]},
        {"exercise_name": "Calf Raises", "sets": [
            {"set_number": 1, "weight": 100, "reps": 20, "completed": True},
            {"set_number": 2, "weight": 100, "reps": 20, "completed": True}
        ]}
    ]
}

# Day -6: Full Body / Core
day4 = {
    "date": (today - timedelta(days=6)).isoformat(),
    "day_name": "Tuesday",
    "split_name": "Core & Stability",
    "is_rest_day": False,
    "duration_minutes": 45,
    "exercises": [
        {"exercise_name": "Planks", "sets": [
            {"set_number": 1, "weight": 85, "reps": 1, "completed": True},
            {"set_number": 2, "weight": 85, "reps": 1, "completed": True}
        ]},
        {"exercise_name": "Crunches", "sets": [
            {"set_number": 1, "weight": 20, "reps": 25, "completed": True},
            {"set_number": 2, "weight": 20, "reps": 20, "completed": True}
        ]},
        {"exercise_name": "Overhead Press", "sets": [
            {"set_number": 1, "weight": 60, "reps": 10, "completed": True},
            {"set_number": 2, "weight": 60, "reps": 8, "completed": True}
        ]}
    ]
}

db.workouts.insert_many([day1, day2, day3, day4])
print("Demo data seeded successfully!")
