from datetime import date, timedelta
import random

from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.attendance import Attendance
from app.models.enrollment import Enrollment
from app.utils.colors import Colors


class AttendanceSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Attendance)

    def seed_attendance(self, courses: list, instructor_ids: list[str]):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping attendance seeding")
            return []
        inspector = inspect(bind)
        if "attendance" not in set(inspector.get_table_names()):
            Colors.warning("Table 'attendance' does not exist, skipping attendance seeding")
            return []

        # Seed attendance for 14 weekdays starting from Monday of the CURRENT week.
        # Going *forward* (rather than backward) guarantees that browsers in UTC+
        # timezones (e.g. UTC+7) always see data for "this week" on the dashboard,
        # even when the Docker container's UTC date lags the browser date by a day.
        today_utc = date.today()
        # Find Monday of the current UTC week (weekday 0=Mon … 6=Sun)
        monday_this_week = today_utc - timedelta(days=today_utc.weekday())

        dates_to_seed = []
        current_date = monday_this_week - timedelta(weeks=1)   # start one week before
        while len(dates_to_seed) < 14:
            if current_date.weekday() < 5:      # Monday to Friday only
                dates_to_seed.append(current_date)
            current_date += timedelta(days=1)

        def get_instructor_id(course_idx: int) -> str:
            if not instructor_ids:
                return None
            return instructor_ids[course_idx % len(instructor_ids)]

        rng = random.Random(42)  # Deterministic seed
        created = []

        for course_idx, course in enumerate(courses):
            course_id = course.id
            recorded_by = course.instructor_id or get_instructor_id(course_idx)

            # Query student profile IDs actively enrolled in this course
            enrollments = self.db.query(Enrollment).filter_by(course_id=course_id, is_active=True).all()
            if not enrollments:
                continue

            for day in dates_to_seed:
                for enrollment in enrollments:
                    student_id = enrollment.student_profile.profile.user_id

                    existing = (
                        self.db.query(Attendance)
                        .filter_by(student_id=student_id, course_id=course_id, date=day)
                        .first()
                    )
                    if existing:
                        created.append(existing)
                        continue

                    # Weighted distribution: 85% present, 10% late, 5% absent
                    rand_val = rng.random()
                    if rand_val < 0.85:
                        status = "present"
                        time_str = "08:00 AM"
                        note = None
                    elif rand_val < 0.95:
                        status = "late"
                        late_min = rng.randint(10, 45)
                        time_str = f"08:{late_min:02d} AM"
                        note = rng.choice([
                            "Delayed by heavy rain/flooding",
                            "Traffic congestion on main boulevard",
                            "Motorcycle flat tire repair",
                            "Overslept due to project study session"
                        ])
                    else:
                        status = "absent"
                        time_str = None
                        note = rng.choice([
                            "Excused sick leave (medical certificate)",
                            "Family emergency in province",
                            "Severe headache and fever",
                            "Unexcused absence — no response received"
                        ])

                    attendance_record = {
                        "student_id": student_id,
                        "course_id": course_id,
                        "session_id": None,  # class session represents admin timetable session, course-level attendance is mapped via course_id
                        "date": day,
                        "status": status,
                        "time": time_str,
                        "note": note,
                        "recorded_by": recorded_by
                    }

                    instance = self.create_one(lambda d=attendance_record: d, skip_if_exists=False)
                    if instance:
                        created.append(instance)

        self.db.commit()
        Colors.success(f"✓ {len(created)} attendance log(s) successfully seeded")
        return created
