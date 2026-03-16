from typing import Optional
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.attendance_service import AttendanceService
from app.schemas.attendance import AttendanceBulkCreate, AttendanceUpdate, AttendanceResponse

attendance_router = APIRouter(tags=["Attendance"])


# ── Mark & view attendance per class session ──────────────────────────────────

@attendance_router.post(
    "/classes/{class_id}/sessions/{session_id}/attendance",
    dependencies=[Depends(PermissionGuard.admin_or_teacher)],
)
def mark_attendance(
    class_id: int,
    session_id: int,
    payload: AttendanceBulkCreate,
    db: Session = Depends(get_db),
):
    return AttendanceService.mark_attendance(db, class_id, session_id, payload)


@attendance_router.get(
    "/classes/{class_id}/sessions/{session_id}/attendance",
    dependencies=[Depends(PermissionGuard.admin_or_teacher)],
)
def get_session_attendance(session_id: int, db: Session = Depends(get_db)):
    return AttendanceService.get_session_attendance(db, session_id)


# ── View & update per student ─────────────────────────────────────────────────

@attendance_router.get("/students/{student_id}/attendance")
def get_student_attendance(
    student_id: str,
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return AttendanceService.get_student_attendance(db, student_id, class_id)


@attendance_router.put(
    "/attendance/{attendance_id}",
    response_model=AttendanceResponse,
    dependencies=[Depends(PermissionGuard.admin_or_teacher)],
)
def update_attendance(
    attendance_id: int,
    status: str = Form(...),
    remarks: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return AttendanceService.update_attendance(
        db, attendance_id, AttendanceUpdate(status=status, remarks=remarks)
    )