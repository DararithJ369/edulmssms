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

	def seed_quizzes(self, course_id: int, instructor_id: str):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping quiz seeding")
			return []
		inspector = inspect(bind)
		if "quizzes" not in set(inspector.get_table_names()):
			Colors.warning("Table 'quizzes' does not exist, skipping quiz seeding")
			return []

		due_date = datetime.utcnow() + timedelta(days=5)
		data = {
			"module_name": "Module 1",
			"title": "Quiz 1",
			"description": "Short quiz",
			"due_date": due_date,
			"course_id": course_id,
			"instructor_id": instructor_id,
		}

		existing = self.db.query(Quiz).filter_by(title=data["title"], course_id=course_id).first()
		if existing:
			Colors.success("Quiz already exists, skipping")
			return [existing]

		quiz = self.create_one(lambda: data, skip_if_exists=False)
		self.db.commit()
		Colors.success("1 quiz seeded")
		return [quiz] if quiz else []
