from datetime import datetime, timedelta

from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.assignment import Assignment
from app.utils.colors import Colors


class AssignmentSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Assignment)

	def seed_assignments(self, courses: list, instructor_ids: list[str]):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping assignment seeding")
			return []
		inspector = inspect(bind)
		if "assignments" not in set(inspector.get_table_names()):
			Colors.warning("Table 'assignments' does not exist, skipping assignment seeding")
			return []

		def get_instructor(index: int) -> str:
			if not instructor_ids:
				return None
			if index < len(instructor_ids):
				return instructor_ids[index]
			return instructor_ids[0]

		created = []
		from app.models.course import Lesson, Module
		for course in courses:
			course_id = course.id
			
			# Fetch lessons dynamically for this course
			lessons = self.db.query(Lesson).join(Module).filter(Module.course_id == course_id).order_by(Lesson.order.asc()).all()
			
			if course.course_code == "CS-205":
				assignments_data = [
					{
						"module_name": "HTML5 & CSS3 Essentials",
						"title": "Responsive Portfolio Website Layout",
						"description": "Design and implement a responsive personal portfolio website showing off your projects using semantic HTML5 tags and clean CSS3 style rules. Must use CSS Flexbox or Grid.",
						"due_date": datetime.utcnow() + timedelta(days=5),
						"attachment_file": "https://res.cloudinary.com/demo/image/upload/sample.jpg",
						"course_id": course_id,
						"teacher_id": get_instructor(0),  # Dr. Sarah Chen
					},
					{
						"module_name": "Client-Side Javascript & DOM Manipulation",
						"title": "Interactive DOM Game Challenge",
						"description": "Build an interactive browser-based game (e.g. Memory Match or Word Guessing) showcasing dynamic DOM element creation, click events, state, and array methods.",
						"due_date": datetime.utcnow() + timedelta(days=12),
						"attachment_file": None,
						"course_id": course_id,
						"teacher_id": get_instructor(0),  # Dr. Sarah Chen
					},
					{
						"module_name": "Backend Development with FastAPI & SQLite",
						"title": "FastAPI REST API Server",
						"description": "Develop a structured FastAPI server with Pydantic request body validation, SQLAlchemy models, and standard path handlers (GET/POST/PUT/DELETE) for a task management service.",
						"due_date": datetime.utcnow() + timedelta(days=19),
						"attachment_file": None,
						"course_id": course_id,
						"teacher_id": get_instructor(0),  # Dr. Sarah Chen
					},
				]
			elif course.course_code == "CS-101":
				assignments_data = [
					{
						"module_name": "Python Basics & Control Flow",
						"title": "Command-Line Calculator Tool",
						"description": "Create a command-line tool in Python that processes mathematical expressions, handles invalid inputs gracefully, and loops until the user types 'exit'.",
						"due_date": datetime.utcnow() + timedelta(days=6),
						"attachment_file": None,
						"course_id": course_id,
						"teacher_id": get_instructor(1),  # Prof. Michael Johnson
					},
					{
						"module_name": "Data Structures & Functions",
						"title": "Student Grade Book Tracker",
						"description": "Implement a Python script that leverages dictionaries and lists to store student records, calculate grade averages, and output top-performing students.",
						"due_date": datetime.utcnow() + timedelta(days=13),
						"attachment_file": None,
						"course_id": course_id,
						"teacher_id": get_instructor(1),  # Prof. Michael Johnson
					},
					{
						"module_name": "Practical Web Scraping & APIs",
						"title": "BeautifulSoup News Scraper",
						"description": "Write a Python script using requests and BeautifulSoup to scrape the front page of a technical news website, parsing article titles, links, and publishing dates into a structured list.",
						"due_date": datetime.utcnow() + timedelta(days=20),
						"attachment_file": None,
						"course_id": course_id,
						"teacher_id": get_instructor(1),  # Prof. Michael Johnson
					},
				]
			else:
				assignments_data = [
					{
						"module_name": "Module 1",
						"title": f"Exercise Assignment - {course.course_name}",
						"description": "Complete introductory exercises and submit your solution.",
						"due_date": datetime.utcnow() + timedelta(days=7),
						"attachment_file": None,
						"course_id": course_id,
						"teacher_id": get_instructor(0),
					}
				]

			for idx, data in enumerate(assignments_data):
				if lessons:
					data["lesson_id"] = lessons[idx % len(lessons)].id
				existing = self.db.query(Assignment).filter_by(title=data["title"], course_id=course_id).first()
				if existing:
					created.append(existing)
					continue

				assignment = self.create_one(lambda d=data: d, skip_if_exists=False)
				if assignment:
					created.append(assignment)

		self.db.commit()
		Colors.success(f"{len(created)} assignment(s) seeded")
		return created

