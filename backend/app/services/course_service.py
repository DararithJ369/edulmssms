from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.course import Course, Lesson, Enrollment
from app.models.user import User
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.lesson import LessonResponse
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse
from app.schemas.user import UserResponse


class CourseService:

    @staticmethod
    def get_courses(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Course.id)).scalar()
        courses = (
            db.query(Course)
            .order_by(Course.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [CourseResponse.model_validate(c) for c in courses],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_course_by_id(db: Session, course_id: int) -> CourseResponse:
        obj = db.query(Course).filter(Course.id == course_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Course not found")
        return CourseResponse.model_validate(obj)

    @staticmethod
    def create_course(db: Session, course_in: CourseCreate) -> CourseResponse:
        obj = Course(**course_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return CourseResponse.model_validate(obj)

    @staticmethod
    def update_course(db: Session, course_id: int, course_in: CourseUpdate) -> CourseResponse:
        obj = db.query(Course).filter(Course.id == course_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Course not found")
        for field, value in course_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return CourseResponse.model_validate(obj)

    @staticmethod
    def delete_course(db: Session, course_id: int) -> dict:
        obj = db.query(Course).filter(Course.id == course_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Course not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Course deleted successfully"}

    # ── Lessons ───────────────────────────────────────────────────────────────

    @staticmethod
    def get_course_lessons(db: Session, course_id: int) -> list:
        if not db.query(Course).filter(Course.id == course_id).first():
            raise HTTPException(status_code=404, detail="Course not found")
        lessons = (
            db.query(Lesson)
            .filter(Lesson.course_id == course_id)
            .order_by(Lesson.order.asc())
            .all()
        )
        return [LessonResponse.model_validate(l) for l in lessons]

    # ── Enrollments ───────────────────────────────────────────────────────────

    @staticmethod
    def enroll_student(
        db: Session, course_id: int, payload: EnrollmentCreate
    ) -> EnrollmentResponse:
        if not db.query(Course).filter(Course.id == course_id).first():
            raise HTTPException(status_code=404, detail="Course not found")

        if not db.query(User).filter(User.id == payload.student_id).first():
            raise HTTPException(status_code=404, detail="Student not found")

        existing = (
            db.query(Enrollment)
            .filter(
                Enrollment.course_id == course_id,
                Enrollment.student_id == payload.student_id,
            )
            .first()
        )
        if existing:
            if existing.is_active:
                raise HTTPException(status_code=400, detail="Student already enrolled")
            existing.is_active = True
            db.commit()
            db.refresh(existing)
            return EnrollmentResponse.model_validate(existing)

        enrollment = Enrollment(
            course_id=course_id,
            student_id=payload.student_id,
            is_active=True,
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return EnrollmentResponse.model_validate(enrollment)

    @staticmethod
    def unenroll_student(db: Session, course_id: int, student_id: int) -> dict:
        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.course_id == course_id,
                Enrollment.student_id == student_id,
                Enrollment.is_active == True,
            )
            .first()
        )
        if not enrollment:
            raise HTTPException(status_code=404, detail="Active enrollment not found")
        enrollment.is_active = False
        db.commit()
        return {"detail": "Student unenrolled successfully"}

    @staticmethod
    def get_course_students(db: Session, course_id: int) -> list:
        if not db.query(Course).filter(Course.id == course_id).first():
            raise HTTPException(status_code=404, detail="Course not found")
        enrollments = (
            db.query(Enrollment)
            .filter(Enrollment.course_id == course_id, Enrollment.is_active == True)
            .all()
        )
        return [UserResponse.model_validate(e.student) for e in enrollments]