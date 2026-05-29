from datetime import datetime, timedelta

from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.quiz import Quiz
from app.utils.colors import Colors


class QuizSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Quiz)

	def seed_quizzes(self, courses: list, instructor_ids: list[str]):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping quiz seeding")
			return []
		inspector = inspect(bind)
		if "quizzes" not in set(inspector.get_table_names()):
			Colors.warning("Table 'quizzes' does not exist, skipping quiz seeding")
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
				quizzes_data = [
					{
						"module_name": "HTML5 & CSS3 Essentials",
						"title": "CSS Grid & Flexbox Properties",
						"description": "Short quiz testing your knowledge of layout alignment, flex basis, container rules, and grid templates.",
						"due_date": datetime.utcnow() + timedelta(days=3),
						"course_id": course_id,
						"instructor_id": get_instructor(0),  # Dr. Sarah Chen
					},
					{
						"module_name": "Client-Side Javascript & DOM Manipulation",
						"title": "JS Scope, Closures & Event Propagation",
						"description": "Assess your understanding of event bubbling, closures, functional array methods, and promise statuses.",
						"due_date": datetime.utcnow() + timedelta(days=8),
						"course_id": course_id,
						"instructor_id": get_instructor(0),  # Dr. Sarah Chen
					},
					{
						"module_name": "Backend Development with FastAPI & SQLite",
						"title": "FastAPI Path Parameters & Pydantic Validation",
						"description": "Verifies basic path operation structures, dependency injection, and Pydantic validation decorators.",
						"due_date": datetime.utcnow() + timedelta(days=15),
						"course_id": course_id,
						"instructor_id": get_instructor(0),  # Dr. Sarah Chen
					},
				]
			elif course.course_code == "CS-101":
				quizzes_data = [
					{
						"module_name": "Python Basics & Control Flow",
						"title": "Python Conditional Flow and Loop Controls",
						"description": "Short quiz covering loop structure operations, break/continue statements, and logical boolean evaluation.",
						"due_date": datetime.utcnow() + timedelta(days=4),
						"course_id": course_id,
						"instructor_id": get_instructor(1),  # Prof. Michael Johnson
					},
					{
						"module_name": "Data Structures & Functions",
						"title": "List Comprehensions & Key-Value Lookups",
						"description": "Tests list comprehension structures, nested dictionaries, tuple immutability, and function namespaces.",
						"due_date": datetime.utcnow() + timedelta(days=9),
						"course_id": course_id,
						"instructor_id": get_instructor(1),  # Prof. Michael Johnson
					},
				]
			else:
				quizzes_data = [
					{
						"module_name": "Module 1",
						"title": f"Introductory Quiz - {course.course_name}",
						"description": "Short quiz to evaluate fundamental knowledge.",
						"due_date": datetime.utcnow() + timedelta(days=5),
						"course_id": course_id,
						"instructor_id": get_instructor(0),
					}
				]

			for idx, data in enumerate(quizzes_data):
				if lessons:
					data["lesson_id"] = lessons[idx % len(lessons)].id
				existing = self.db.query(Quiz).filter_by(title=data["title"], course_id=course_id).first()
				if existing:
					created.append(existing)
					continue

				quiz = self.create_one(lambda d=data: d, skip_if_exists=False)
				if quiz:
					created.append(quiz)

		self.db.commit()
		Colors.success(f"{len(created)} quiz(zes) seeded")
		return created

