from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Module
from app.utils.colors import Colors


class ModuleSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Module)

    def seed_modules(self, courses: list) -> list[Module]:
        """Seed modules for all courses"""
        if not courses:
            return []

        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping module seeding")
            return []
        inspector = inspect(bind)
        if "modules" not in set(inspector.get_table_names()):
            Colors.warning("Modules table does not exist, skipping")
            return []

        modules = []
        for course in courses:
            course_id = course.id
            if course.course_code == "CS-205":
                data_list = [
                    {
                        "title": "HTML5 & CSS3 Essentials",
                        "description": "Introduction to document layout structures, semantic tags, visual CSS rules, Flexbox, and responsive Grid styling.",
                        "course_id": course_id,
                        "order": 1,
                    },
                    {
                        "title": "Client-Side Javascript & DOM Manipulation",
                        "description": "Programming dynamic web features, variables, array callback functions, asynchronous fetch, and interactive browser events.",
                        "course_id": course_id,
                        "order": 2,
                    },
                    {
                        "title": "Backend Development with FastAPI & SQLite",
                        "description": "Building performant, type-safe REST APIs, configuring routing paths, implementing Pydantic validation schemas, and database migrations.",
                        "course_id": course_id,
                        "order": 3,
                    },
                ]
            elif course.course_code == "CS-101":
                data_list = [
                    {
                        "title": "Python Basics & Control Flow",
                        "description": "Getting started with Python interpreter, variables, basic operators, loop structures (for/while), and logic conditionals.",
                        "course_id": course_id,
                        "order": 1,
                    },
                    {
                        "title": "Data Structures & Functions",
                        "description": "Working with composite datatypes (tuples, dictionaries, lists, sets) and designing clean, reusable and testable functions.",
                        "course_id": course_id,
                        "order": 2,
                    },
                    {
                        "title": "Practical Web Scraping & APIs",
                        "description": "Harnessing the python-requests library, parsing responses with BeautifulSoup, and requesting remote REST APIs safely.",
                        "course_id": course_id,
                        "order": 3,
                    },
                ]
            else:
                data_list = [
                    {
                        "title": "General Foundations",
                        "description": "Introduction to basic principles and frameworks.",
                        "course_id": course_id,
                        "order": 1,
                    }
                ]

            for data in data_list:
                # Check if module already exists
                existing = self.db.query(Module).filter_by(title=data["title"], course_id=course_id).first()
                if existing:
                    modules.append(existing)
                    continue

                module = Module(**data)
                self.db.add(module)
                modules.append(module)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(modules)} module(s) seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding modules: {e}")
            return []

        return modules


