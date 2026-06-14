from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Course
from app.utils.colors import Colors


class CourseSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Course)

    def seed_courses(self, instructor_ids: list[str], subjects: list):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping course seeding")
            return []
        inspector = inspect(bind)
        if "courses" not in set(inspector.get_table_names()):
            Colors.warning("Table 'courses' does not exist, skipping course seeding")
            return []

        # Resolve subjects by code or name
        subject_map = {s.code: s.id for s in subjects} if subjects else {}
        
        # Helper to retrieve instructors deterministically
        def get_instructor_id(index: int) -> str:
            if not instructor_ids:
                return None
            return instructor_ids[index % len(instructor_ids)]

        # Fetch instructor names to match their profiles
        from app.models.user_profile import UserProfile
        from app.models.user import User
        
        def get_instructor_name(user_id: str) -> str:
            if not user_id:
                return "Faculty Instructor"
            profile = self.db.query(UserProfile).filter_by(user_id=user_id).first()
            if profile and profile.full_name:
                return profile.full_name
            user = self.db.query(User).filter_by(id=user_id).first()
            return user.username if user else "Faculty Instructor"

        courses_data = [
            {
                "course_name": "Database Design & SQL",
                "course_code": "DS-210",
                "description": "Comprehensive study of relational database architectures, normalization, ER modeling, SQL querying, and database performance tuning.",
                "category": "Data Science",
                "difficulty": "intermediate",
                "instructor_idx": 1, # Prof. Chhim Vutha
                "subject_code": "DS210",
                "duration": 12,
                "price": 350.0,
                "max_students": 60,
                "is_published": True
            },
            {
                "course_name": "Advanced Web Development",
                "course_code": "IT-201",
                "description": "Full-stack web application development using React, Next.js, and FastAPI backend servers with SQLAlchemy ORM.",
                "category": "Information Technology",
                "difficulty": "advanced",
                "instructor_idx": 10, # Web Dev specialist
                "subject_code": "IT201",
                "duration": 15,
                "price": 450.0,
                "max_students": 50,
                "is_published": True
            },
            {
                "course_name": "Machine Learning Foundations",
                "course_code": "DS-301",
                "description": "Mathematical formulations, algorithms, and practical implementations of supervised and unsupervised machine learning models.",
                "category": "Data Science",
                "difficulty": "advanced",
                "instructor_idx": 2, # Dr. Keo Sophal
                "subject_code": "DS301",
                "duration": 16,
                "price": 500.0,
                "max_students": 45,
                "is_published": True
            },
            {
                "course_name": "Software Architecture & Design Patterns",
                "course_code": "SE-202",
                "description": "Architectural blueprints, UML modeling, SOLID design principles, and creational, structural, and behavioral design patterns.",
                "category": "Software Engineering",
                "difficulty": "advanced",
                "instructor_idx": 16,
                "subject_code": "SE202",
                "duration": 12,
                "price": 380.0,
                "max_students": 40,
                "is_published": True
            },
            {
                "course_name": "Applied Statistics for Data Science",
                "course_code": "MATH-102",
                "description": "Probability distributions, statistical inference, hypothesis testing, ANOVA, and linear regression models for data analysts.",
                "category": "Applied Mathematics & Statistics",
                "difficulty": "intermediate",
                "instructor_idx": 1,
                "subject_code": "MATH102",
                "duration": 10,
                "price": 300.0,
                "max_students": 70,
                "is_published": True
            },
            {
                "course_name": "Operating Systems & Shell Scripting",
                "course_code": "CS-301",
                "description": "Principles of kernel scheduling, memory management, process concurrency, Linux CLI navigation, and shell script automation.",
                "category": "Computer Science",
                "difficulty": "intermediate",
                "instructor_idx": 8,
                "subject_code": "CS301",
                "duration": 12,
                "price": 320.0,
                "max_students": 55,
                "is_published": True
            },
            {
                "course_name": "Computer Networks & Security",
                "course_code": "IT-301",
                "description": "Decoupled study of TCP/IP protocol stacks, network routing and switching configurations, and cyber security foundations.",
                "category": "Information Technology",
                "difficulty": "intermediate",
                "instructor_idx": 12,
                "subject_code": "IT301",
                "duration": 12,
                "price": 340.0,
                "max_students": 50,
                "is_published": True
            },
            {
                "course_name": "Data Structures & Complexity",
                "course_code": "CS-201",
                "description": "Implementations of arrays, lists, trees, graphs, and hash tables, combined with rigorous mathematical complexity analysis.",
                "category": "Computer Science",
                "difficulty": "beginner",
                "instructor_idx": 6,
                "subject_code": "CS201",
                "duration": 14,
                "price": 400.0,
                "max_students": 80,
                "is_published": True
            },
            {
                "course_name": "Agile Software Development",
                "course_code": "SE-301",
                "description": "Agile methodologies, scrum framework, sprint planning, project backlogs, Git workflows, and DevOps CI/CD deployment channels.",
                "category": "Software Engineering",
                "difficulty": "beginner",
                "instructor_idx": 17,
                "subject_code": "SE301",
                "duration": 10,
                "price": 280.0,
                "max_students": 60,
                "is_published": True
            },
            {
                "course_name": "Introduction to Python Programming",
                "course_code": "CS-101",
                "description": "Perfect introduction to programming for beginners. Master Python's clean syntax, control flow statements, data structures (lists, dicts), and functions.",
                "category": "Computer Science",
                "difficulty": "beginner",
                "instructor_idx": 5,
                "subject_code": "CS101",
                "duration": 8,
                "price": 250.0,
                "max_students": 90,
                "is_published": True
            }
        ]

        created = []
        for data in courses_data:
            existing = self.db.query(Course).filter_by(course_code=data["course_code"]).first()
            
            instructor_id = get_instructor_id(data["instructor_idx"])
            instructor_name = get_instructor_name(instructor_id)
            
            c_data = {
                "course_name": data["course_name"],
                "course_code": data["course_code"],
                "description": data["description"],
                "category": data["category"],
                "difficulty": data["difficulty"],
                "instructor_id": instructor_id,
                "instructor_name": instructor_name,
                "subject_id": subject_map.get(data["subject_code"]),
                "duration": data["duration"],
                "price": data["price"],
                "max_students": data["max_students"],
                "enrollment_status": "open",
                "is_published": data["is_published"]
            }

            if existing:
                # Update attributes to match the new seeded structure
                for k, v in c_data.items():
                    setattr(existing, k, v)
                created.append(existing)
                continue

            instance = self.create_one(lambda d=c_data: d, skip_if_exists=False)
            if instance:
                created.append(instance)

        self.db.commit()
        Colors.success(f"{len(created)} course(s) seeded")
        return created
