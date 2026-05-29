from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Course
from app.utils.colors import Colors


class CourseSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Course)

	def seed_courses(self, instructor_ids: list[str], subjects: list):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping course seeding")
			return []
		inspector = inspect(bind)
		if "courses" not in set(inspector.get_table_names()):
			Colors.warning("Table 'courses' does not exist, skipping course seeding")
			return []

		# Resolve subjects by code or name
		subject_map = {s.code: s.id for s in subjects} if subjects else {}
		
		# Dr. Sarah Chen (0)
		# Prof. Michael Johnson (1)
		# Dr. James Wilson (2)
		# Prof. Lisa Anderson (3)
		def get_instructor(index: int) -> str:
			if not instructor_ids:
				return None
			if index < len(instructor_ids):
				return instructor_ids[index]
			return instructor_ids[0]

		courses_data = [
			{
				"course_name": "Full-Stack Web Development",
				"course_code": "CS-205",
				"description": "Comprehensive journey in building full-stack web applications. Covers semantic HTML5, modern CSS3 (Flexbox/Grid), client-side JS DOM APIs, Next.js dashboard routing, and FastAPI backend servers with SQLAlchemy ORM.",
				"category": "Computer Science",
				"difficulty": "intermediate",
				"instructor_name": "Dr. Sarah Chen",
				"instructor_id": get_instructor(0),  # Dr. Sarah Chen
				"subject_id": subject_map.get("CS205"),  # Web Development Subject
				"duration": 12,
				"price": 499.0,
				"max_students": 50,
				"enrollment_status": "open",
				"is_published": True,
			},
			{
				"course_name": "Introduction to Python and Web Programming",
				"course_code": "CS-101",
				"description": "Perfect introduction to programming for beginners. Master Python's clean syntax, control flow statements, data structures (lists, dicts), function structures, and fetch APIs.",
				"category": "Computer Science",
				"difficulty": "beginner",
				"instructor_name": "Prof. Michael Johnson",
				"instructor_id": get_instructor(1),  # Prof. Michael Johnson
				"subject_id": subject_map.get("CS201"),  # Data Structures / Base Subject
				"duration": 8,
				"price": 299.0,
				"max_students": 60,
				"enrollment_status": "open",
				"is_published": True,
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

