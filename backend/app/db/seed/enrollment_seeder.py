from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine
from datetime import date

from app.db.seed.base import BaseSeeder
from app.models.enrollment import Enrollment
from app.models.student_profile import StudentProfile
from app.models.course import Course
from app.models.grade_level import GradeLevel
from app.utils.colors import Colors


class EnrollmentSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Enrollment)

    def seed_enrollments(self, courses: list, student_profiles: list, academic_year_id: int):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping enrollment seeding")
            return []
        inspector = inspect(bind)
        if "enrollments" not in set(inspector.get_table_names()):
            Colors.warning("Table 'enrollments' does not exist, skipping enrollment seeding")
            return []

        # Map course codes to target grade level names
        # Y1: CS-101, CS-201
        # Y2: DS-210, IT-201
        # Y3: MATH-102, SE-202, SE-301
        # Y4: DS-301, IT-301, CS-301
        course_grade_mapping = {
            "CS-101": "Year 1",
            "CS-201": "Year 1",
            "DS-210": "Year 2",
            "IT-201": "Year 2",
            "MATH-102": "Year 3",
            "SE-202": "Year 3",
            "SE-301": "Year 3",
            "DS-301": "Year 4",
            "IT-301": "Year 4",
            "CS-301": "Year 4"
        }

        # Resolve grade level name to ID
        grade_levels = self.db.query(GradeLevel).all()
        grade_name_to_id = {gl.name: gl.id for gl in grade_levels}

        created = []
        
        # Enrol each student in courses matching their grade level
        for student in student_profiles:
            student_profile_id = student.id
            student_grade_id = student.grade_level_id

            # Find matching grade level name
            student_grade_name = None
            for name, gl_id in grade_name_to_id.items():
                if gl_id == student_grade_id:
                    student_grade_name = name
                    break

            if not student_grade_name:
                continue

            for course in courses:
                target_grade_name = course_grade_mapping.get(course.course_code)
                if target_grade_name != student_grade_name:
                    continue

                existing = (
                    self.db.query(Enrollment)
                    .filter_by(course_id=course.id, student_profile_id=student_profile_id)
                    .first()
                )
                
                # Stripe Payment mock integration
                # Assign completing payment statuses for 90% of students, 10% pending
                import random
                rng = random.Random(student_profile_id) # deterministic per student
                is_completed = rng.random() < 0.90
                
                payment_status = "completed" if is_completed else "pending"
                amount_paid = course.price if is_completed else 0.0
                payment_id = f"pi_mock_{course.id}_{student_profile_id}" if is_completed else None

                enroll_data = {
                    "course_id": course.id,
                    "student_profile_id": student_profile_id,
                    "grade_level_id": student_grade_id,
                    "academic_year_id": academic_year_id,
                    "term_id": 1,  # Semester I (default current term)
                    "is_active": True,
                    "enrolled_date": date.today(),
                    "payment_status": payment_status,
                    "payment_id": payment_id,
                    "amount_paid": amount_paid
                }

                if existing:
                    # Update fields
                    for k, v in enroll_data.items():
                        setattr(existing, k, v)
                    created.append(existing)
                    continue

                instance = self.create_one(lambda d=enroll_data: d, skip_if_exists=False)
                if instance:
                    created.append(instance)

        self.db.commit()
        Colors.success(f"{len(created)} enrollment(s) seeded successfully")
        return created
