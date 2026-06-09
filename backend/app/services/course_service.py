import logging
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.course import Course, Lesson, Module
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.lesson import LessonResponse
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse
from app.schemas.user import UserResponse

logger = logging.getLogger(__name__)


class CourseService:

    @staticmethod
    def get_courses(
        db: Session,
        page: int = 1,
        limit: int = 10,
        search: str | None = None,
        category: str | None = None,
        published: bool | None = None,
    ) -> dict:
        query = db.query(Course)

        if search:
            query = query.filter(
                (Course.course_name.ilike(f"%{search}%"))
                | (Course.course_code.ilike(f"%{search}%"))
                | (Course.description.ilike(f"%{search}%"))
            )

        if category:
            query = query.filter(Course.category == category)

        if published is not None:
            query = query.filter(Course.is_published == published)

        total = query.with_entities(func.count(Course.id)).scalar()
        courses = (
            query.order_by(Course.created_at.desc())
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

    # 🚀 NESTED TRANSACTION ENGINE
    @staticmethod
    def create_course(db: Session, course_in: CourseCreate) -> CourseResponse:
        # 1. Extract the modules list to keep it from unpacking into standard database columns
        course_data = course_in.model_dump()
        modules_list = course_data.pop("modules", [])

        # 2. Re-verify unique course code before initiating insert transaction layout
        existing = db.query(Course).filter(Course.course_code == course_data.get("course_code")).first()
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Course code identifier abbreviation '{course_data.get('course_code')}' is already taken."
            )

        # 3. Save core baseline Course object
        obj = Course(**course_data)
        obj.has_modules = len(modules_list) > 0
        db.add(obj)
        db.commit()
        db.refresh(obj)

        try:
            # 4. Iterate through module layers
            for mod_data in modules_list:
                lessons_list = mod_data.pop("lessons", [])
                
                db_module = Module(
                    course_id=obj.id,
                    title=mod_data.get("title"),
                    description=mod_data.get("description", ""),
                    order=mod_data.get("order", 1)
                )
                db.add(db_module)
                db.commit()
                db.refresh(db_module)

                # 5. Connect deep lessons items to their current structural parent module
                for les_data in lessons_list:
                    db_lesson = Lesson(
                        module_id=db_module.id,
                        title=les_data.get("title"),
                        description=les_data.get("description", ""),
                        content=les_data.get("content", ""),
                        duration=les_data.get("duration", "10min"),
                        material_type=les_data.get("material_type", "article"),
                        material_url=les_data.get("material_url"),
                        material_file=les_data.get("material_file"),
                        order=les_data.get("order", 1)
                    )
                    db.add(db_lesson)
            
            db.commit()
            db.refresh(obj)  # Ensure session properties pull structural mutations safely
            
        except Exception as e:
            db.rollback()
            # Clean up the already-committed course shell
            try:
                db.delete(obj)
                db.commit()
            except Exception as cleanup_err:
                db.rollback()
                logger.error("Failed to clean up orphaned course id=%s: %s", obj.id, cleanup_err)
            logger.error("Course creation failed during module/lesson insertion: %s", e)
            raise HTTPException(
                status_code=500,
                detail=f"Course creation failed while adding modules: {str(e)}"
            )

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
            .join(Module, Lesson.module_id == Module.id)
            .filter(Module.course_id == course_id)
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
        result = []
        for e in enrollments:
            sp = e.student_profile          
            if not sp:
                continue
            up = sp.profile                 
            if not up:
                continue
            user = up.user                  
            if not user:
                continue
            result.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": up.full_name or user.username,
                "role": "Student",
                "is_active": user.is_active,
                "enrolled_date": str(e.enrolled_date) if e.enrolled_date else None,
            })
        return result