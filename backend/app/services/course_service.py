from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.course import Course, Lesson, Module
from app.models.enrollment import Enrollment
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.user_profile import UserProfile
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.lesson import LessonResponse
from app.schemas.enrollment import EnrollmentCreate, EnrollmentResponse


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
    def get_enrolled_courses(
        db: Session,
        current_user,
        page: int = 1,
        limit: int = 10,
        search: str | None = None,
        category: str | None = None,
    ) -> dict:
        up = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if not up:
            return {"data": [], "meta": {"page": page, "total": 0, "limit": limit}}
        sp = db.query(StudentProfile).filter_by(profile_id=up.id).first()
        if not sp:
            return {"data": [], "meta": {"page": page, "total": 0, "limit": limit}}
        enrolled_ids = [
            row[0] for row in db.query(Enrollment.course_id).filter(
                Enrollment.student_profile_id == sp.id,
                Enrollment.is_active,
            ).all()
        ]

        if not enrolled_ids:
            return {"data": [], "meta": {"page": page, "total": 0, "limit": limit}}

        query = db.query(Course).filter(Course.id.in_(enrolled_ids))

        if search:
            query = query.filter(
                (Course.course_name.ilike(f"%{search}%"))
                | (Course.course_code.ilike(f"%{search}%"))
                | (Course.description.ilike(f"%{search}%"))
            )

        if category:
            query = query.filter(Course.category == category)

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

        if course_data.get("instructor_id"):
            inst_user = db.query(User).filter(User.id == course_data.get("instructor_id")).first()
            if inst_user:
                course_data["instructor_name"] = inst_user.profile.full_name or inst_user.username if inst_user.profile else inst_user.username
            else:
                course_data["instructor_name"] = None
        else:
            course_data["instructor_name"] = None

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
            db.delete(obj)   # Safely purge broken course items on relational anomalies
            db.commit()
            raise HTTPException(
                status_code=500, 
                detail=f"Transactional workflow aborted during compilation: {str(e)}"
            )

        return CourseResponse.model_validate(obj)

    @staticmethod
    def update_course(db: Session, course_id: int, course_in: CourseUpdate) -> CourseResponse:
        obj = db.query(Course).filter(Course.id == course_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Course not found")
        
        course_data = course_in.model_dump(exclude_unset=True)
        if "instructor_id" in course_data:
            if course_data["instructor_id"]:
                inst_user = db.query(User).filter(User.id == course_data["instructor_id"]).first()
                if inst_user:
                    course_data["instructor_name"] = inst_user.profile.full_name or inst_user.username if inst_user.profile else inst_user.username
                else:
                    course_data["instructor_name"] = None
            else:
                course_data["instructor_name"] = None

        for field, value in course_data.items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return CourseResponse.model_validate(obj)

    @staticmethod
    def delete_course(db: Session, course_id: int) -> dict:
        obj = db.query(Course).filter(Course.id == course_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Course not found")

        # 1. Clean up Certificates referencing the course
        from app.models.certificate import Certificate, StudentCertificate
        db.query(StudentCertificate).filter(StudentCertificate.course_id == course_id).delete(synchronize_session=False)
        db.query(Certificate).filter(Certificate.course_id == course_id).delete(synchronize_session=False)

        # 2. Clean up Attendance referencing the course
        from app.models.attendance import Attendance
        db.query(Attendance).filter(Attendance.course_id == course_id).delete(synchronize_session=False)

        # 3. Clean up Announcements referencing the course
        from app.models.announcement import Announcement
        db.query(Announcement).filter(Announcement.course_id == course_id).delete(synchronize_session=False)

        # 4. Clean up Exams, Results, and AI Conversations associated with course's lessons
        # Find all lesson IDs first
        lesson_ids = [
            r[0] for r in db.query(Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .filter(Module.course_id == course_id)
            .all()
        ]

        # Find all exam IDs
        from app.models.exam import Exam
        if lesson_ids:
            exam_ids = [r[0] for r in db.query(Exam.id).filter(Exam.lesson_id.in_(lesson_ids)).all()]
        else:
            exam_ids = []

        # Clean up Results associated with course assignments, quizzes, or exams
        from app.models.result import Result
        from app.models.assignment import Assignment
        from app.models.quiz import Quiz

        assignment_ids = [r[0] for r in db.query(Assignment.id).filter(Assignment.course_id == course_id).all()]
        quiz_ids = [r[0] for r in db.query(Quiz.id).filter(Quiz.course_id == course_id).all()]

        if assignment_ids:
            db.query(Result).filter(Result.assignment_id.in_(assignment_ids)).delete(synchronize_session=False)
        if quiz_ids:
            db.query(Result).filter(Result.quiz_id.in_(quiz_ids)).delete(synchronize_session=False)
        if exam_ids:
            db.query(Result).filter(Result.exam_id.in_(exam_ids)).delete(synchronize_session=False)

        # Clean up Exams
        if exam_ids:
            db.query(Exam).filter(Exam.id.in_(exam_ids)).delete(synchronize_session=False)

        # Clean up AI Conversations and messages
        from app.models.ai_tutor import AIConversation, AIMessage
        if lesson_ids:
            conv_ids = [r[0] for r in db.query(AIConversation.id).filter(AIConversation.lesson_id.in_(lesson_ids)).all()]
            if conv_ids:
                db.query(AIMessage).filter(AIMessage.conversation_id.in_(conv_ids)).delete(synchronize_session=False)
                db.query(AIConversation).filter(AIConversation.id.in_(conv_ids)).delete(synchronize_session=False)

        # 5. Delete course itself (which cascades to modules, lessons, assignments, quizzes, enrollments)
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
    def _sync_enrolled_count(db: Session, course_id: int):
        count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.course_id == course_id,
            Enrollment.is_active,
        ).scalar() or 0
        db.query(Course).filter(Course.id == course_id).update({"student_enrolled": count})
        db.commit()

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
        CourseService._sync_enrolled_count(db, course_id)
        return EnrollmentResponse.model_validate(enrollment)

    @staticmethod
    def unenroll_student(db: Session, course_id: int, student_id: int) -> dict:
        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.course_id == course_id,
                Enrollment.student_id == student_id,
                Enrollment.is_active,
            )
            .first()
        )
        if not enrollment:
            raise HTTPException(status_code=404, detail="Active enrollment not found")
        enrollment.is_active = False
        db.commit()
        CourseService._sync_enrolled_count(db, course_id)
        return {"detail": "Student unenrolled successfully"}

    @staticmethod
    def _get_student_profile(db: Session, user) -> StudentProfile:
        """Resolve student_profile from the current user object."""
        up = db.query(UserProfile).filter_by(user_id=user.id).first()
        if not up:
            raise HTTPException(status_code=400, detail="User profile not found")
        sp = db.query(StudentProfile).filter_by(profile_id=up.id).first()
        if not sp:
            raise HTTPException(status_code=400, detail="Student profile not found. Only students can self-enroll.")
        return sp

    @staticmethod
    def self_enroll(db: Session, course_id: int, current_user) -> dict:
        from app.models.academic_year import AcademicYear

        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        sp = CourseService._get_student_profile(db, current_user)

        # Check existing
        existing = (
            db.query(Enrollment)
            .filter(Enrollment.course_id == course_id, Enrollment.student_profile_id == sp.id)
            .first()
        )
        if existing:
            if existing.is_active:
                raise HTTPException(status_code=400, detail="Already enrolled in this course")
            existing.is_active = True
            existing.dropped_date = None
            existing.enrolled_date = date.today()
            db.commit()
            CourseService._sync_enrolled_count(db, course_id)
            return {"detail": "Re-enrolled successfully", "enrollment_id": existing.id}

        # Get current academic year
        ay = db.query(AcademicYear).filter(AcademicYear.is_current).first()
        if not ay:
            ay = db.query(AcademicYear).order_by(AcademicYear.id.desc()).first()
        if not ay:
            raise HTTPException(status_code=500, detail="No academic year configured")

        enrollment = Enrollment(
            course_id=course_id,
            student_profile_id=sp.id,
            grade_level_id=sp.grade_level_id,
            academic_year_id=ay.id,
            term_id=1,
            is_active=True,
            enrolled_date=date.today(),
            payment_status="completed",
            amount_paid=0,
        )
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        CourseService._sync_enrolled_count(db, course_id)
        return {"detail": "Enrolled successfully", "enrollment_id": enrollment.id}

    @staticmethod
    def check_enrollment(db: Session, course_id: int, current_user) -> dict:
        up = db.query(UserProfile).filter_by(user_id=current_user.id).first()
        if not up:
            return {"enrolled": False}
        sp = db.query(StudentProfile).filter_by(profile_id=up.id).first()
        if not sp:
            return {"enrolled": False}
        existing = (
            db.query(Enrollment)
            .filter(
                Enrollment.course_id == course_id,
                Enrollment.student_profile_id == sp.id,
                Enrollment.is_active,
            )
            .first()
        )
        return {"enrolled": existing is not None, "enrollment_id": existing.id if existing else None}

    @staticmethod
    def get_course_students(db: Session, course_id: int) -> list:
        if not db.query(Course).filter(Course.id == course_id).first():
            raise HTTPException(status_code=404, detail="Course not found")
        enrollments = (
            db.query(Enrollment)
            .filter(Enrollment.course_id == course_id, Enrollment.is_active)
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
                "student_profile_id": sp.id,
                "student_code": sp.student_id,
                "username": user.username,
                "email": user.email,
                "full_name": up.full_name or user.username,
                "role": "Student",
                "is_active": user.is_active,
                "enrolled_date": str(e.enrolled_date) if e.enrolled_date else None,
            })
        return result