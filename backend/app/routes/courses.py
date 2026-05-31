from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.course_service import CourseService
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.enrollment import EnrollmentCreate

course_router = APIRouter(prefix="/courses", tags=["Courses"])


@course_router.get("")
def get_all_courses(
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    category: str | None = None,
    published: bool | None = Query(None),
    db: Session = Depends(get_db),
):
    return CourseService.get_courses(db, page, limit, search, category, published)


@course_router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    return CourseService.get_course_by_id(db, course_id)


@course_router.post("", response_model=CourseResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    return CourseService.create_course(db, payload)


@course_router.put("/{course_id}", response_model=CourseResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)):
    return CourseService.update_course(db, course_id, payload)


@course_router.delete("/{course_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_course(course_id: int, db: Session = Depends(get_db)):
    return CourseService.delete_course(db, course_id)


# ── Lessons ───────────────────────────────────────────────────────────────────

@course_router.get("/{course_id}/lessons")
def get_course_lessons(course_id: int, db: Session = Depends(get_db)):
    return CourseService.get_course_lessons(db, course_id)


@course_router.get("/{course_id}/modules")
def get_course_modules(course_id: int, db: Session = Depends(get_db)):
    from app.models.course import Module
    modules = db.query(Module).filter(Module.course_id == course_id).order_by(Module.order.asc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "order": m.order,
            "lessons": [
                {
                    "id": l.id,
                    "title": l.title,
                    "description": l.description,
                    "duration": l.duration,
                    "material_type": l.material_type,
                    "order": l.order
                } for l in m.lessons
            ]
        } for m in modules
    ]


# ── Enrollments ────────────────-----------------------------------------------

@course_router.post("/{course_id}/enroll", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def enroll_student(course_id: int, payload: EnrollmentCreate, db: Session = Depends(get_db)):
    return CourseService.enroll_student(db, course_id, payload)


@course_router.delete("/{course_id}/enroll/{student_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def unenroll_student(course_id: int, student_id: str, db: Session = Depends(get_db)):
    return CourseService.unenroll_student(db, course_id, student_id)


@course_router.get("/{course_id}/students")
def get_course_students(course_id: int, db: Session = Depends(get_db)):
    return CourseService.get_course_students(db, course_id)


# ── Grades / Results for this course ──────────────────────────────────────────

@course_router.get("/{course_id}/grades")
def get_course_grades(
    course_id: int,
    db: Session = Depends(get_db),
    _=Depends(PermissionGuard.get_current_user),
):
    """Return all results linked to assignments / exams / quizzes in this course."""
    from app.models.result import Result
    from app.models.assignment import Assignment
    from app.models.exam import Exam
    from app.models.quiz import Quiz
    from app.schemas.result import ResultResponse

    # Collect result IDs linked to this course's assessments
    assignment_ids = [r.id for r in db.query(Assignment.id).filter(Assignment.course_id == course_id).all()]
    exam_ids       = [r.id for r in db.query(Exam.id).filter(Exam.course_id == course_id).all()]
    quiz_ids       = [r.id for r in db.query(Quiz.id).filter(Quiz.course_id == course_id).all()]

    from sqlalchemy import or_
    results = (
        db.query(Result)
        .filter(
            or_(
                Result.assignment_id.in_(assignment_ids) if assignment_ids else False,
                Result.exam_id.in_(exam_ids) if exam_ids else False,
                Result.quiz_id.in_(quiz_ids) if quiz_ids else False,
            )
        )
        .all()
    )

    return [ResultResponse.model_validate(r) for r in results]