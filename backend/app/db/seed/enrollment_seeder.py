from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine
from datetime import date

from app.db.seed.base import BaseSeeder
from app.models.enrollment import Enrollment
from app.models.student_profile import StudentProfile
from app.models.academic_year import AcademicYear
from app.utils.colors import Colors


class EnrollmentSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Enrollment)

	def seed_enrollments(self, course_id: int, student_profile_ids: list[int], academic_year_id: int = 1):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping enrollment seeding")
			return []
		inspector = inspect(bind)
		if "enrollments" not in set(inspector.get_table_names()):
			Colors.warning("Table 'enrollments' does not exist, skipping enrollment seeding")
			return []

		created = []
		for student_profile_id in student_profile_ids:
			existing = (
				self.db.query(Enrollment)
				.filter_by(course_id=course_id, student_profile_id=student_profile_id)
				.first()
			)
			if existing:
				created.append(existing)
				continue
			instance = self.create_one(
				lambda c=course_id, s=student_profile_id, ay=academic_year_id: {
					"course_id": c,
					"student_profile_id": s,
					"academic_year_id": ay,
					"is_active": True,
					"enrolled_date": date.today(),
				},
				skip_if_exists=False,
			)
			if instance:
				created.append(instance)

		self.db.commit()
		Colors.success(f"{len(created)} enrollment(s) seeded")
		return created
