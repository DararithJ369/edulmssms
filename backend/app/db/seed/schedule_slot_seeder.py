from datetime import time
from app.models.schedule_slot import ScheduleSlot
from app.utils.colors import Colors

class ScheduleSlotSeeder:
    def __init__(self, db):
        self.db = db

    def seed_schedule_slots(self, class_id: int, instructor_ids_list: list, subjects: list):
        existing_slots = self.db.query(ScheduleSlot).count()
        if existing_slots > 0:
            return []

        slots_data = [
            {
                "class_id": class_id,
                "teacher_id": instructor_ids_list[0],
                "subject_id": subjects[1].id if len(subjects) > 1 else subjects[0].id,
                "day_of_week": "MONDAY",
                "start_time": time(9, 0),
                "end_time": time(11, 0),
                "room": "Room 302",
                "is_active": True
            },
            {
                "class_id": class_id,
                "teacher_id": instructor_ids_list[0],
                "subject_id": subjects[1].id if len(subjects) > 1 else subjects[0].id,
                "day_of_week": "WEDNESDAY",
                "start_time": time(9, 0),
                "end_time": time(11, 0),
                "room": "Room 302",
                "is_active": True
            },
            {
                "class_id": class_id,
                "teacher_id": instructor_ids_list[0],
                "subject_id": subjects[1].id if len(subjects) > 1 else subjects[0].id,
                "day_of_week": "FRIDAY",
                "start_time": time(14, 0),
                "end_time": time(16, 0),
                "room": "Lab 1",
                "is_active": True
            }
        ]
        
        seeded_slots = []
        for sd in slots_data:
            slot_obj = ScheduleSlot(**sd)
            self.db.add(slot_obj)
            seeded_slots.append(slot_obj)
            
        self.db.commit()
        Colors.success("Seeded schedule slots successfully")
        return seeded_slots