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

	def seed_assignments(self, course_id: int, teacher_id: str):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping assignment seeding")
			return []
		inspector = inspect(bind)
		if "assignments" not in set(inspector.get_table_names()):
			Colors.warning("Table 'assignments' does not exist, skipping assignment seeding")
			return []

		due_date = datetime.utcnow() + timedelta(days=7)
		data = {
			"module_name": "Module 1",
			"title": "Homework 1",
			"description": "Complete basic exercises",
			"due_date": due_date,
			"attachment_file": None,
			"course_id": course_id,
			"teacher_id": teacher_id,
		}

		existing = self.db.query(Assignment).filter_by(title=data["title"], course_id=course_id).first()
		if existing:
			Colors.success("Assignment already exists, skipping")
			return [existing]

		assignment = self.create_one(lambda: data, skip_if_exists=False)
		self.db.commit()
		Colors.success("1 assignment seeded")
		return [assignment] if assignment else []
