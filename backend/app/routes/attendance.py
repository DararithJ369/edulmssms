from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.attendance_service import AttendanceService
from app.schemas.attendance import AttendanceBulkCreate, AttendanceUpdate, AttendanceResponse

attendance_router = APIRouter(tags=["Attendance"])


# ── Generic attendance list & delete ──────────────────────────────────────────

@attendance_router.get("/attendance")
def get_all_attendance(page: int = 1, limit: int = 10, search: str = "", db: Session = Depends(get_db)):
    return AttendanceService.get_all_attendance(db, page, limit, search)


@attendance_router.delete("/attendance/{attendance_id}", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    return AttendanceService.delete_attendance(db, attendance_id)


# ── Mark & view attendance per class session ──────────────────────────────────

@attendance_router.post(
    "/classes/{class_id}/sessions/{session_id}/attendance",
    dependencies=[Depends(PermissionGuard.admin_or_instructor)],
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
    dependencies=[Depends(PermissionGuard.admin_or_instructor)],
)
def get_session_attendance(session_id: int, db: Session = Depends(get_db)):
    return AttendanceService.get_session_attendance(db, session_id)


# ── View & update per student ─────────────────────────────────────────────────

@attendance_router.get("/students/{student_id}/attendance")
def get_student_attendance(
    student_id: str,
    class_id: Optional[int] = None,
    current_user=Depends(PermissionGuard.get_current_user),
    db: Session = Depends(get_db),
):
    if not PermissionGuard.can_view_student(db, current_user, student_id):
        raise HTTPException(status_code=403, detail="Not authorized to view student attendance")
    return AttendanceService.get_student_attendance(db, student_id, class_id)


@attendance_router.put(
    "/attendance/{attendance_id}",
    response_model=AttendanceResponse,
    dependencies=[Depends(PermissionGuard.admin_or_instructor)],
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