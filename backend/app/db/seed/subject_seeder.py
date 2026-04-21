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
				"name": "Data Structures",
				"code": "CS201",
				"description": "Fundamental data structures and algorithms",
				"credits": 4,
				"hours_per_week": 4,
				"is_active": True,
			},
			{
				"instructor_id": instructor_id,
				"name": "Web Development",
				"code": "CS205",
				"description": "Full-stack web development with modern frameworks",
				"credits": 3,
				"hours_per_week": 3,
				"is_active": True,
			},
			{
				"instructor_id": instructor_id,
				"name": "Database Management",
				"code": "CS210",
				"description": "Database design, SQL, and optimization",
				"credits": 3,
				"hours_per_week": 3,
				"is_active": True,
			},
			{
				"instructor_id": instructor_id,
				"name": "Software Engineering",
				"code": "CS301",
				"description": "Software design patterns and development methodologies",
				"credits": 3,
				"hours_per_week": 3,
				"is_active": True,
			},
			{
				"instructor_id": instructor_id,
				"name": "Machine Learning",
				"code": "CS401",
				"description": "Introduction to machine learning algorithms and applications",
				"credits": 4,
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
