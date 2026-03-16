from typing import Optional
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.enrollment_service import EnrollmentService
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse

enrollment_router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@enrollment_router.get("", dependencies=[Depends(PermissionGuard.admin_or_teacher)])
def get_all_enrollments(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return EnrollmentService.get_enrollments(db, page, limit)


@enrollment_router.get("/{enrollment_id}", response_model=EnrollmentResponse)
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    return EnrollmentService.get_enrollment_by_id(db, enrollment_id)


@enrollment_router.post("", response_model=EnrollmentResponse, dependencies=[Depends(PermissionGuard.admin_or_teacher)])
def create_enrollment(
    student_id: str = Form(...),
    course_id: int = Form(...),
    is_active: bool = Form(True),
    db: Session = Depends(get_db),
):
    return EnrollmentService.create_enrollment(
        db, EnrollmentCreate(student_id=student_id, course_id=course_id, is_active=is_active)
    )


@enrollment_router.put("/{enrollment_id}", response_model=EnrollmentResponse, dependencies=[Depends(PermissionGuard.admin_or_teacher)])
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