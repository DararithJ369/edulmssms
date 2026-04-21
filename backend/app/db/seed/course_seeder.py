from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Course
from app.utils.colors import Colors


class CourseSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Course)

	def seed_courses(self, instructor_id: str, subject_id: int | None = None):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping course seeding")
			return []
		inspector = inspect(bind)
		if "courses" not in set(inspector.get_table_names()):
			Colors.warning("Table 'courses' does not exist, skipping course seeding")
			return []

		courses_data = [
			{
				"course_name": "Algebra Basics",
				"course_code": "ALG-001",
				"description": "Introductory algebra course",
				"category": "Math",
				"difficulty": "beginner",
				"instructor_id": instructor_id,
				"subject_id": subject_id,
			},
			{
				"course_name": "English Writing",
				"course_code": "ENG-001",
				"description": "English writing fundamentals",
				"category": "Language",
				"difficulty": "beginner",
				"instructor_id": instructor_id,
				"subject_id": subject_id,
			},
		]

		created = []
		for data in courses_data:
			existing = self.db.query(Course).filter_by(course_code=data["course_code"]).first()
			if existing:
				created.append(existing)
				continue
			instance = self.create_one(lambda d=data: d, skip_if_exists=False)
			if instance:
				created.append(instance)

		self.db.commit()
		Colors.success(f"{len(created)} course(s) seeded")
		return created
