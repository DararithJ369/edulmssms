from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.subject import Subject
from app.utils.colors import Colors


class SubjectSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Subject)

	def seed_subjects(self, instructor_id: str):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping subject seeding")
			return []
		inspector = inspect(bind)
		if "subjects" not in set(inspector.get_table_names()):
			Colors.warning("Table 'subjects' does not exist, skipping subject seeding")
			return []

		subjects_data = [
			{
				"instructor_id": instructor_id,
				"name": "Mathematics",
				"code": "MTH101",
				"description": "Core math subject",
				"credits": 3,
				"hours_per_week": 4,
				"is_active": True,
			},
			{
				"instructor_id": instructor_id,
				"name": "English",
				"code": "ENG101",
				"description": "Core english subject",
				"credits": 3,
				"hours_per_week": 4,
				"is_active": True,
			},
		]

		created = []
		for data in subjects_data:
			existing = self.db.query(Subject).filter_by(name=data["name"]).first()
			if existing:
				created.append(existing)
				continue
			instance = self.create_one(lambda d=data: d, skip_if_exists=False)
			if instance:
				created.append(instance)

		self.db.commit()
		Colors.success(f"{len(created)} subject(s) seeded")
		return created
