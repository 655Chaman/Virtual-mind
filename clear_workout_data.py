import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from api.database import get_db

db = get_db()
db.workouts.delete_many({})
print("All workout data cleared successfully.")
