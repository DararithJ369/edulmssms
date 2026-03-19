from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.course_service import CourseService
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse
from app.schemas.enrollment import EnrollmentCreate

course_router = APIRouter(prefix="/courses", tags=["Courses"])


@course_router.get("")
def get_all_courses(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return CourseService.get_courses(db, page, limit)


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


# ── Enrollments ───────────────────────────────────────────────────────────────

@course_router.post("/{course_id}/enroll", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def enroll_student(course_id: int, payload: EnrollmentCreate, db: Session = Depends(get_db)):
    return CourseService.enroll_student(db, course_id, payload)


@course_router.delete("/{course_id}/enroll/{student_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def unenroll_student(course_id: int, student_id: str, db: Session = Depends(get_db)):
    return CourseService.unenroll_student(db, course_id, student_id)


@course_router.get("/{course_id}/students")
def get_course_students(course_id: int, db: Session = Depends(get_db)):
    return CourseService.get_course_students(db, course_id)