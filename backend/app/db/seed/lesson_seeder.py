from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Lesson
from app.utils.colors import Colors


class LessonSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Lesson)

    def seed_lessons(self, module_id: int | None = None) -> list[Lesson]:
        """Seed lessons for modules"""
        if not module_id:
            return []

        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping lesson seeding")
            return []
        inspector = inspect(bind)
        if "lessons" not in set(inspector.get_table_names()):
            Colors.warning("Lessons table does not exist, skipping")
            return []

        data_list = [
            {
                "title": "Lesson 1: Introduction to Basics",
                "description": "Learn the fundamental concepts and get started",
                "duration": "45min",
                "material_type": "video",
                "material_url": "https://example.com/lesson1.mp4",
                "order": 1,
                "module_id": module_id,
            },
            {
                "title": "Lesson 2: Core Concepts",
                "description": "Deep dive into core concepts and principles",
                "duration": "60min",
                "material_type": "video",
                "material_url": "https://example.com/lesson2.mp4",
                "order": 2,
                "module_id": module_id,
            },
            {
                "title": "Lesson 3: Practice and Application",
                "description": "Apply what you've learned through practice",
                "duration": "30min",
                "material_type": "document",
                "material_url": "https://example.com/lesson3.pdf",
                "order": 3,
                "module_id": module_id,
            },
        ]

        lessons = []
        for data in data_list:
            # Check if lesson already exists
            existing = self.db.query(Lesson).filter_by(title=data["title"], module_id=module_id).first()
            if existing:
                lessons.append(existing)
                continue

            lesson = Lesson(**data)
            self.db.add(lesson)
            lessons.append(lesson)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(lessons)} lesson(s) seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding lessons: {e}")
            return []

        return lessons


        return lessons
