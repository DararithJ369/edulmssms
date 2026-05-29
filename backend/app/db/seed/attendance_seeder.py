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

	def seed_attendance(self, courses: list, student_ids: list[str], instructor_ids: list[str]):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping attendance seeding")
			return []
		inspector = inspect(bind)
		if "attendance" not in set(inspector.get_table_names()):
			Colors.warning("Table 'attendance' does not exist, skipping attendance seeding")
			return []

		import random
		from datetime import date, timedelta
		
		# Deterministic random generator for consistent seed output
		rng = random.Random(42)

		dates_to_seed = [
			date.today(),
			date.today() - timedelta(days=1),
			date.today() - timedelta(days=2),
		]

		def get_instructor(index: int) -> str:
			if not instructor_ids:
				return None
			if index < len(instructor_ids):
				return instructor_ids[index]
			return instructor_ids[0]

		created = []
		for course in courses:
			course_id = course.id
			
			# Dr. Sarah Chen for CS-205, Prof. Michael Johnson for CS-101
			recorded_by = get_instructor(0) if course.course_code == "CS-205" else get_instructor(1)

			for day in dates_to_seed:
				for student_id in student_ids:
					existing = (
						self.db.query(Attendance)
						.filter_by(student_id=student_id, course_id=course_id, date=day)
						.first()
					)
					if existing:
						created.append(existing)
						continue

					# Determine status: 90% present, 6% late, 4% absent
					rand_val = rng.random()
					if rand_val < 0.90:
						status = "present"
						time_str = "08:00"
						note = None
					elif rand_val < 0.96:
						status = "late"
						# 10 to 30 minutes late
						late_min = rng.randint(10, 30)
						time_str = f"08:{late_min:02d}"
						note = rng.choice([
							"Subway line breakdown",
							"Heavy morning traffic congestion",
							"Residential power outage delayed router boot",
							"Forgot laptop charger, turned back"
						])
					else:
						status = "absent"
						time_str = None
						note = rng.choice([
							"Excused medical checkup appointment",
							"Family bereavement event",
							"Severe seasonal influenza, resting",
							"Unexcused absence - no response"
						])

					instance = self.create_one(
						lambda: {
							"student_id": student_id,
							"course_id": course_id,
							"date": day,
							"status": status,
							"time": time_str,
							"note": note,
							"recorded_by": recorded_by,
						},
						skip_if_exists=False,
					)
					if instance:
						created.append(instance)

		self.db.commit()
		Colors.success(f"{len(created)} attendance record(s) seeded")
		return created

