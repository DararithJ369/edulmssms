from datetime import datetime, time, timedelta

from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.exam import Exam
from app.utils.colors import Colors


class ExamSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Exam)

	def seed_exams(self, lessons: list, instructor_ids: list[str]):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping exam seeding")
			return []
		inspector = inspect(bind)
		if "exams" not in set(inspector.get_table_names()):
			Colors.warning("Table 'exams' does not exist, skipping exam seeding")
			return []

		def get_instructor(index: int) -> str:
			if not instructor_ids:
				return None
			if index < len(instructor_ids):
				return instructor_ids[index]
			return instructor_ids[0]

		created = []
		for lesson in lessons:
			lesson_id = lesson.id
			title = lesson.title

			# Match exams to specific milestone lessons
			if title == "Responsive Designs & CSS Grid":
				data = {
					"lesson_id": lesson_id,
					"created_by": get_instructor(0),  # Dr. Sarah Chen
					"title": "Web Development Midterm Exam",
					"description": "Comprehensive midterm assessment evaluating your mastery of semantic HTML5 structure, CSS3 Flexbox layout alignment, and CSS Grid systems.",
					"exam_date": datetime.utcnow() + timedelta(days=14),
					"start_time": time(9, 0),
					"end_time": time(11, 0),
					"duration": 120,
					"total_marks": 100,
					"pass_mark": 50,
					"venue": "Lab 103 - Main Campus",
				}
			elif title == "SQLAlchemy ORM & Database Sessions":
				data = {
					"lesson_id": lesson_id,
					"created_by": get_instructor(0),  # Dr. Sarah Chen
					"title": "Full-Stack Web Development Final Exam",
					"description": "Comprehensive final exam covering Next.js dynamic routing, client state management, FastAPI path decorators, and SQLAlchemy ORM operations.",
					"exam_date": datetime.utcnow() + timedelta(days=28),
					"start_time": time(14, 0),
					"end_time": time(17, 0),
					"duration": 180,
					"total_marks": 100,
					"pass_mark": 50,
					"venue": "Auditorium B - Computer Science Building",
				}
			elif title == "For/While Loops and Control Statements":
				data = {
					"lesson_id": lesson_id,
					"created_by": get_instructor(1),  # Prof. Michael Johnson
					"title": "Python Control Flow Midterm",
					"description": "Practical coding exam verifying understanding of list syntax, loop iterations, conditional branches, and basic input validation.",
					"exam_date": datetime.utcnow() + timedelta(days=15),
					"start_time": time(10, 0),
					"end_time": time(12, 0),
					"duration": 120,
					"total_marks": 100,
					"pass_mark": 50,
					"venue": "Lab 204 - Computer Science Building",
				}
			elif title == "REST API Queries and JSON Serialization":
				data = {
					"lesson_id": lesson_id,
					"created_by": get_instructor(1),  # Prof. Michael Johnson
					"title": "Introduction to Python Programming Final",
					"description": "Hands-on exam covering custom functions, advanced dictionary mappings, web scraping with requests/BeautifulSoup, and REST API serialization.",
					"exam_date": datetime.utcnow() + timedelta(days=29),
					"start_time": time(9, 0),
					"end_time": time(12, 0),
					"duration": 180,
					"total_marks": 100,
					"pass_mark": 50,
					"venue": "Lab 205 - Computer Science Building",
				}
			else:
				continue

			existing = self.db.query(Exam).filter_by(title=data["title"], lesson_id=lesson_id).first()
			if existing:
				created.append(existing)
				continue

			exam = self.create_one(lambda d=data: d, skip_if_exists=False)
			if exam:
				created.append(exam)

		self.db.commit()
		Colors.success(f"{len(created)} exam(s) seeded")
		return created

