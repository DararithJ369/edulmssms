from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.subject import Subject
from app.utils.colors import Colors


class SubjectSeeder(BaseSeeder):
	def __init__(self, db: Session):
		super().__init__(db, Subject)

	def seed_subjects(self, instructor_ids: list[str]):
		bind = self.db.bind
		if not isinstance(bind, Engine):
			Colors.warning("Database bind is not an Engine, skipping subject seeding")
			return []
		inspector = inspect(bind)
		if "subjects" not in set(inspector.get_table_names()):
			Colors.warning("Table 'subjects' does not exist, skipping subject seeding")
			return []

		# Map subjects to specialized instructors:
		# Dr. Sarah Chen (0) -> Web Development
		# Prof. Michael Johnson (1) -> Data Structures, Database Management
		# Dr. James Wilson (2) -> Machine Learning
		# Prof. Lisa Anderson (3) -> Software Engineering
		# Fallback to the first instructor if list is too short or empty
		def get_instructor(index: int) -> str:
			if not instructor_ids:
				return None
			if index < len(instructor_ids):
				return instructor_ids[index]
			return instructor_ids[0]

		subjects_data = [
			{
				"instructor_id": get_instructor(1),  # Prof. Michael Johnson
				"name": "Data Structures",
				"code": "CS201",
				"description": "Fundamental data structures, computational complexity, and classic algorithms.",
				"credits": 4,
				"hours_per_week": 4,
				"is_active": True,
			},
			{
				"instructor_id": get_instructor(0),  # Dr. Sarah Chen
				"name": "Web Development",
				"code": "CS205",
				"description": "Full-stack web development with modern React and FastAPI frameworks.",
				"credits": 3,
				"hours_per_week": 3,
				"is_active": True,
			},
			{
				"instructor_id": get_instructor(1),  # Prof. Michael Johnson
				"name": "Database Management",
				"code": "CS210",
				"description": "Relational database design, query optimization, indexing, and SQL.",
				"credits": 3,
				"hours_per_week": 3,
				"is_active": True,
			},
			{
				"instructor_id": get_instructor(3),  # Prof. Lisa Anderson
				"name": "Software Engineering",
				"code": "CS301",
				"description": "Software architecture, design patterns, testing, and agile methodologies.",
				"credits": 3,
				"hours_per_week": 3,
				"is_active": True,
			},
			{
				"instructor_id": get_instructor(2),  # Dr. James Wilson
				"name": "Machine Learning",
				"code": "CS401",
				"description": "Supervised and unsupervised learning models, regression, clustering, and neural networks.",
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

