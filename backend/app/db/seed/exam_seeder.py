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

    def seed_exams(self, lessons: list, instructor_ids: list[str]):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping exam seeding")
            return []
        inspector = inspect(bind)
        if "exams" not in set(inspector.get_table_names()):
            Colors.warning("Table 'exams' does not exist, skipping exam seeding")
            return []

        def get_instructor_id(course_idx: int) -> str:
            if not instructor_ids:
                return None
            return instructor_ids[course_idx % len(instructor_ids)]

        created = []
        from app.models.course import Course, Module, Lesson
        
        # Query courses to seed exams for each of them
        courses = self.db.query(Course).all()
        
        for course_idx, course in enumerate(courses):
            course_id = course.id
            instructor_id = course.instructor_id or get_instructor_id(course_idx)
            
            # Fetch lessons for this course
            course_lessons = self.db.query(Lesson).join(Module).filter(Module.course_id == course_id).order_by(Lesson.order.asc()).all()
            if not course_lessons:
                continue

            # We map:
            # - Midterm Exam to Lesson 10 (or middle lesson)
            # - Final Exam to Lesson 20 (or last lesson)
            midterm_lesson = course_lessons[min(9, len(course_lessons) - 1)]
            final_lesson = course_lessons[-1]

            exams_data = [
                {
                    "lesson_id": midterm_lesson.id,
                    "created_by": instructor_id,
                    "title": f"{course.course_name} Midterm Exam",
                    "description": f"Midterm examination evaluating your mastery of core units in {course.course_name}. Covers the first 2 modules.",
                    "exam_date": datetime.utcnow() + timedelta(days=14),
                    "start_time": time(9, 0),
                    "end_time": time(11, 0),
                    "duration": 120,
                    "total_marks": 100,
                    "pass_mark": 50,
                    "venue": "Lab 103 — Main Building",
                },
                {
                    "lesson_id": final_lesson.id,
                    "created_by": instructor_id,
                    "title": f"{course.course_name} Final Exam",
                    "description": f"Comprehensive final exam covering all 5 modules in {course.course_name}. Focuses on advanced implementations.",
                    "exam_date": datetime.utcnow() + timedelta(days=28),
                    "start_time": time(14, 0),
                    "end_time": time(17, 0),
                    "duration": 180,
                    "total_marks": 100,
                    "pass_mark": 50,
                    "venue": "Auditorium B — Computer Science Center",
                }
            ]

            for data in exams_data:
                existing = self.db.query(Exam).filter_by(title=data["title"], lesson_id=data["lesson_id"]).first()
                if existing:
                    # Update
                    for k, v in data.items():
                        setattr(existing, k, v)
                    created.append(existing)
                    continue

                exam = self.create_one(lambda d=data: d, skip_if_exists=False)
                if exam:
                    created.append(exam)

        self.db.commit()
        Colors.success(f"{len(created)} exam(s) seeded")
        return created
