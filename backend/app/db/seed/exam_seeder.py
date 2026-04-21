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

	def seed_exams(self, lesson_id: int, created_by: str):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping exam seeding")
			return []
		inspector = inspect(bind)
		if "exams" not in set(inspector.get_table_names()):
			Colors.warning("Table 'exams' does not exist, skipping exam seeding")
			return []

		exam_date = datetime.utcnow() + timedelta(days=14)
		data = {
			"lesson_id": lesson_id,
			"created_by": created_by,
			"title": "Midterm Exam",
			"description": "Midterm assessment",
			"exam_date": exam_date,
			"start_time": time(9, 0),
			"end_time": time(10, 0),
			"duration": 60,
			"total_marks": 100,
			"pass_mark": 50,
			"venue": "Room A",
		}

		existing = self.db.query(Exam).filter_by(title=data["title"], lesson_id=lesson_id).first()
		if existing:
			Colors.success("Exam already exists, skipping")
			return [existing]

		exam = self.create_one(lambda: data, skip_if_exists=False)
		self.db.commit()
		Colors.success("1 exam seeded")
		return [exam] if exam else []
