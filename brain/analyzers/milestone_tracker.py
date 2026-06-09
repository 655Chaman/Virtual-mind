import os
import json
from datetime import datetime, timedelta

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'milestones', 'phase0.json')

class MilestoneTracker:
    def __init__(self):
        # Create directories if they don't exist
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        self.data = self._load_data()

    def _load_data(self):
        if not os.path.exists(DATA_FILE):
            return {"phase": "PHASE 0", "started": "2026-02-22", "checkpoint": "2026-05-22", "milestones": []}
        with open(DATA_FILE, 'r') as f:
            return json.load(f)

    def _save_data(self):
        with open(DATA_FILE, 'w') as f:
            json.dump(self.data, f, indent=2)

    def _calculate_dynamic_fields(self, milestone):
        started_date = datetime.strptime(self.data["started"], "%Y-%m-%d")
        deadline_date = started_date + timedelta(days=milestone.get("deadline_day", 0))
        today = datetime.now()
        
        milestone["deadline_date"] = deadline_date.strftime("%Y-%m-%d")
        # Ensure we round correctly for days remaining
        td = deadline_date - today
        milestone["days_remaining"] = td.days + (1 if td.seconds > 0 else 0)
        return milestone

    def get_all_milestones(self):
        grouped = {"DEEN": [], "ELESIUM": [], "INFLUENCE": [], "SELF": []}
        for m in self.data.get("milestones", []):
            m_computed = self._calculate_dynamic_fields(dict(m))
            pillar = m.get("pillar", "UNKNOWN")
            if pillar not in grouped:
                grouped[pillar] = []
            grouped[pillar].append(m_computed)
        return grouped

    def update_milestone(self, milestone_id, status=None, notes=None):
        updated = False
        for m in self.data.get("milestones", []):
            if m["id"] == milestone_id:
                if status is not None:
                    m["status"] = status
                    if status == "done" and not m.get("completed_date"):
                        m["completed_date"] = datetime.now().strftime("%Y-%m-%d")
                    elif status != "done":
                        m["completed_date"] = None
                if notes is not None:
                    m["notes"] = notes
                updated = True
                break
        if updated:
            self._save_data()
            return True
        return False

    def get_summary(self):
        total = 0
        done = 0
        in_progress = 0
        not_started = 0
        overdue = 0
        
        by_pillar = {}

        for m in self.data.get("milestones", []):
            m_comp = self._calculate_dynamic_fields(dict(m))
            pillar = m_comp["pillar"]
            if pillar not in by_pillar:
                by_pillar[pillar] = {"total": 0, "done": 0, "in_progress": 0, "not_started": 0, "overdue": 0}

            total += 1
            by_pillar[pillar]["total"] += 1
            
            st = m_comp["status"]
            if st == "done":
                done += 1
                by_pillar[pillar]["done"] += 1
            elif st == "in_progress":
                in_progress += 1
                by_pillar[pillar]["in_progress"] += 1
            else:
                not_started += 1
                by_pillar[pillar]["not_started"] += 1

            if st != "done" and m_comp["days_remaining"] < 0:
                overdue += 1
                by_pillar[pillar]["overdue"] += 1

        return {
            "total": total,
            "done": done,
            "in_progress": in_progress,
            "not_started": not_started,
            "overdue": overdue,
            "by_pillar": by_pillar
        }

    def run_checkpoint_score(self):
        # Determine status dynamically from milestones where possible
        
        def is_done(m_id):
            for m in self.data.get("milestones", []):
                if m["id"] == m_id:
                    return m["status"] == "done"
            return False

        # Read specific IDs for the 8 questions
        # Q2: Can I read basic Arabic? -> m1 (Learn to read Arabic)
        # Q3: Have I finished Sealed Nectar and Kitab? -> m2 and m3
        # Q4: Is Elesium MVP live? -> m6
        # Q5: 10 essays published? -> m10
        # Q8: Circle of 3-5 brothers? -> m19

        questions = [
            {
                "id": "q1",
                "question": "Have I prayed ALL 5 Salah on time, every day, for 90 days?",
                "auto_scored": False,
                "score": None,
                "notes": "Requires querying session tracker / daily logs."
            },
            {
                "id": "q2",
                "question": "Can I read basic Arabic?",
                "auto_scored": True,
                "score": "YES" if is_done("m1") else "NO",
                "notes": "Derived from milestone 'Learn to read Arabic'"
            },
            {
                "id": "q3",
                "question": "Have I finished 'The Sealed Nectar' and 'Kitab At-Tawheed'?",
                "auto_scored": True,
                "score": "YES" if (is_done("m2") and is_done("m3")) else "NO",
                "notes": "Derived from Seerah and Tawheed milestones"
            },
            {
                "id": "q4",
                "question": "Is Elesium MVP live and attracting users?",
                "auto_scored": True,
                "score": "YES" if is_done("m6") else "NO", # Also depends on "First paying customers" (m7) if we want to be strict, but MVP is m6
                "notes": "Derived from MVP milestone"
            },
            {
                "id": "q5",
                "question": "Have I published at least 10 essays?",
                "auto_scored": True,
                "score": "YES" if is_done("m10") else "NO",
                "notes": "Derived from '10 essays published' milestone"
            },
            {
                "id": "q6",
                "question": "Have I run at least a half-marathon distance in training?",
                "auto_scored": False,
                "score": None,
                "notes": "Manual verification required."
            },
            {
                "id": "q7",
                "question": "Am I waking up for Fajr without an alarm?",
                "auto_scored": False,
                "score": None,
                "notes": "Manual verification required."
            },
            {
                "id": "q8",
                "question": "Do I have a circle of at least 3-5 like-minded Muslim brothers?",
                "auto_scored": True,
                "score": "YES" if is_done("m19") else "NO",
                "notes": "Derived from brotherly circle milestone."
            }
        ]
        
        return {
            "checkpoint_date": self.data.get("checkpoint"),
            "questions": questions
        }
