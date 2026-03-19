from datetime import date

from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.attendance import Attendance
from app.utils.colors import Colors


class AttendanceSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Attendance)

	def seed_attendance(self, course_id: int, student_ids: list[str], recorded_by: str):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping attendance seeding")
			return []
		inspector = inspect(bind)
		if "attendance" not in set(inspector.get_table_names()):
			Colors.warning("Table 'attendance' does not exist, skipping attendance seeding")
			return []

		today = date.today()
		created = []
		for student_id in student_ids:
			existing = (
				self.db.query(Attendance)
				.filter_by(student_id=student_id, course_id=course_id, date=today)
				.first()
			)
			if existing:
				created.append(existing)
				continue

			instance = self.create_one(
				lambda c=course_id, s=student_id, r=recorded_by: {
					"student_id": s,
					"course_id": c,
					"date": today,
					"status": "present",
					"time": "08:00",
					"note": None,
					"recorded_by": r,
				},
				skip_if_exists=False,
			)
			if instance:
				created.append(instance)

		self.db.commit()
		Colors.success(f"{len(created)} attendance record(s) seeded")
		return created
