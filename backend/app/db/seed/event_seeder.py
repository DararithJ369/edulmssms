from datetime import datetime, timedelta
from app.models.event import Event
from app.utils.colors import Colors

class EventSeeder:
    def __init__(self, db):
        self.db = db

    def seed_events(self, class_id: int):
        # Check if events already exist for this class
        existing_events = self.db.query(Event).filter_by(class_id=class_id).count()
        if existing_events > 0:
            return []

        now = datetime.now()
        events_data = [
            {
                "title": "Full-Stack Web Dev Workshop",
                "description": "Hands-on session building FastAPI backends with Next.js frontends.",
                "start_time": now + timedelta(days=2, hours=2),
                "end_time": now + timedelta(days=2, hours=4),
                "class_id": class_id
            },
            {
                "title": "AI & Robotics Guest Lecture",
                "description": "Special presentation from visiting industry researchers.",
                "start_time": now + timedelta(days=4, hours=6),
                "end_time": now + timedelta(days=4, hours=8),
                "class_id": class_id
            }
        ]
        
        seeded_events = []
        for ev in events_data:
            event_obj = Event(**ev)
            self.db.add(event_obj)
            seeded_events.append(event_obj)
            
        self.db.commit()
        Colors.success(f"Seeded calendar events for Class #{class_id}")
        return seeded_events