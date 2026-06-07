from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.enrollment_service import EnrollmentService
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse, EnrollmentCheckoutRequest
from app.models.academic_year import AcademicYear
from app.models.term import Term
from app.models.course import Course
from datetime import datetime

enrollment_router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@enrollment_router.get("", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def get_all_enrollments(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return EnrollmentService.get_enrollments(db, page, limit)


@enrollment_router.get("/{enrollment_id}", response_model=EnrollmentResponse, dependencies=[Depends(PermissionGuard.get_current_user)])
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    return EnrollmentService.get_enrollment_by_id(db, enrollment_id)


@enrollment_router.post("", response_model=EnrollmentResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def create_enrollment(
    student_id: str = Form(...),
    course_id: int = Form(...),
    is_active: bool = Form(True),
    db: Session = Depends(get_db),
):
    return EnrollmentService.create_enrollment(
        db, EnrollmentCreate(student_id=student_id, course_id=course_id, is_active=is_active)
    )


@enrollment_router.put("/{enrollment_id}", response_model=EnrollmentResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def update_enrollment(
    enrollment_id: int,
    is_active: Optional[bool] = Form(None),
    db: Session = Depends(get_db),
):
    return EnrollmentService.update_enrollment(
        db, enrollment_id, EnrollmentUpdate(is_active=is_active)
    )


@enrollment_router.delete("/{enrollment_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    return EnrollmentService.delete_enrollment(db, enrollment_id)


# Student self-enroll (no payment needed — school LMS like Moodle)
@enrollment_router.post("/checkout", response_model=EnrollmentResponse)
def checkout_enrollment(
    payload: EnrollmentCheckoutRequest,
    current_user=Depends(PermissionGuard.get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.name.lower() != "student":
        raise HTTPException(status_code=403, detail="Student role required")

    if not current_user.profile or not current_user.profile.student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found")

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.enrollment_status != "open":
        raise HTTPException(status_code=400, detail="Course enrollment is currently closed")

    academic_year = (
        db.query(AcademicYear)
        .filter(AcademicYear.is_current == True, AcademicYear.is_active == True)
        .first()
    )
    if not academic_year:
        raise HTTPException(status_code=400, detail="No current academic year configured")

    term_id = payload.term_id
    if term_id:
        term = db.query(Term).filter(Term.id == term_id).first()
        if not term or term.academic_year_id != academic_year.id:
            raise HTTPException(status_code=400, detail="Invalid term for current academic year")
    else:
        current_term = (
            db.query(Term)
            .filter(
                Term.academic_year_id == academic_year.id,
                Term.is_current == True,
                Term.is_active == True,
            )
            .first()
        )
        term_id = current_term.id if current_term else None

    enrollment_in = EnrollmentCreate(
        student_profile_id=current_user.profile.student_profile.id,
        course_id=payload.course_id,
        academic_year_id=academic_year.id,
        term_id=term_id,
        grade_level_id=current_user.profile.student_profile.grade_level_id,
        enrolled_date=date.today(),
        is_active=True,
    )

    return EnrollmentService.create_enrollment(db, enrollment_in)
