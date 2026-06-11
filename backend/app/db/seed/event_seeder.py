from datetime import datetime, timedelta
from app.models.event import Event
from app.utils.colors import Colors

class EventSeeder:
    def __init__(self, db):
        self.db = db

    def seed_events(self, class_id: int):
        existing_events = self.db.query(Event).count()
        if existing_events > 0:
            return []

        now = datetime.now()
        events_data = [
            {
                "title": "Full-Stack Web Dev Workshop",
                "description": "Hands-on session building FastAPI backends with Next.js frontends.",
                "start_time": now + timedelta(days=1, hours=2),
                "end_time": now + timedelta(days=1, hours=4),
                "class_id": class_id
            },
            {
                "title": "Semester Midterm Exams",
                "description": "Midterm examinations for all academic departments.",
                "start_time": now + timedelta(days=5, hours=1),
                "end_time": now + timedelta(days=8, hours=8),
                "class_id": None
            },
            {
                "title": "AI & Robotics Guest Lecture",
                "description": "Special presentation from visiting industry researchers.",
                "start_time": now + timedelta(days=3, hours=6),
                "end_time": now + timedelta(days=3, hours=8),
                "class_id": class_id
            },
            {
                "title": "Global Coding Hackathon",
                "description": "24-hour programming challenge with prizes.",
                "start_time": now + timedelta(days=10, hours=0),
                "end_time": now + timedelta(days=11, hours=0),
                "class_id": None
            }
        ]
        
        seeded_events = []
        for ev in events_data:
            event_obj = Event(**ev)
            self.db.add(event_obj)
            seeded_events.append(event_obj)
            
        self.db.commit()
        Colors.success("Seeded calendar events successfully")
        return seeded_events