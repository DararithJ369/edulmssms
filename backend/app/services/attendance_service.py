from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.attendance import Attendance
from app.models.class_session import ClassSession
from app.models.user import User
from app.schemas.attendance import AttendanceBulkCreate, AttendanceUpdate, AttendanceResponse, AttendanceCreate
from app.services.base_service import get_or_404, paginate, apply_update, delete_and_commit
from app.services.role_filter import apply_student_role_filter


class AttendanceService:

    @staticmethod
    def mark_attendance(
        db: Session, class_id: int, session_id: int, payload: AttendanceBulkCreate
    ) -> list:
        session = (
            db.query(ClassSession)
            .filter(ClassSession.id == session_id, ClassSession.class_id == class_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Class session not found")

        records = []
        for item in payload.attendance:
            existing = (
                db.query(Attendance)
                .filter(
                    Attendance.session_id == session_id,
                    Attendance.student_id == item.student_id,
                )
                .first()
            )
            if existing:
                existing.status = item.status
                existing.note = item.note
                existing.time = item.time
                records.append(existing)
            else:
                record = Attendance(
                    session_id=session_id,
                    student_id=item.student_id,
                    course_id=payload.course_id,
                    date=payload.date,
                    status=item.status,
                    note=item.note,
                    time=item.time,
                    recorded_by=session.teacher_id,
                )
                db.add(record)
                records.append(record)

        db.commit()
        for r in records:
            db.refresh(r)
        return [AttendanceResponse.model_validate(r) for r in records]

    @staticmethod
    def get_student_attendance(
        db: Session, student_id: int, class_id: int = None
    ) -> list:
        if not db.query(User).filter(User.id == student_id).first():
            raise HTTPException(status_code=404, detail="Student not found")

        query = db.query(Attendance).filter(Attendance.student_id == student_id)
        if class_id is not None:
            query = query.join(ClassSession).filter(ClassSession.class_id == class_id)

        records = query.order_by(Attendance.id.desc()).all()
        return [AttendanceResponse.model_validate(r) for r in records]

    @staticmethod
    def get_session_attendance(db: Session, session_id: int) -> list:
        records = db.query(Attendance).filter(Attendance.session_id == session_id).all()
        return [AttendanceResponse.model_validate(r) for r in records]

    @staticmethod
    def update_attendance(
        db: Session, attendance_id: int, attendance_in: AttendanceUpdate
    ) -> AttendanceResponse:
        record = get_or_404(db, Attendance, attendance_id, "Attendance record")
        apply_update(record, attendance_in)
        db.commit()
        db.refresh(record)
        return AttendanceResponse.model_validate(record)

    @staticmethod
    def get_all_attendance(
        db: Session, page: int = 1, limit: int = 10, search: str = "", current_user = None
    ) -> dict:
        query = db.query(Attendance)

        query, early = apply_student_role_filter(query, Attendance.student_id, current_user, page, limit)
        if early is not None:
            return early

        if search:
            from app.models.user_profile import UserProfile
            query = query.join(UserProfile, Attendance.student_id == UserProfile.user_id).filter(
                (UserProfile.full_name.ilike(f"%{search}%")) |
                (Attendance.status.ilike(f"%{search}%"))
            )

        return paginate(db, Attendance, AttendanceResponse, Attendance.created_at.desc(), page, limit, query=query)

    @staticmethod
    def delete_attendance(db: Session, attendance_id: int) -> dict:
        return delete_and_commit(db, Attendance, attendance_id, "Attendance record")

    @staticmethod
    def create_attendance(
        db: Session, attendance_in: AttendanceCreate, recorded_by: str
    ) -> AttendanceResponse:
        record = Attendance(
            student_id=attendance_in.student_id,
            course_id=attendance_in.course_id,
            session_id=attendance_in.session_id,
            date=attendance_in.date,
            status=attendance_in.status,
            time=attendance_in.time,
            note=attendance_in.note,
            recorded_by=recorded_by,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return AttendanceResponse.model_validate(record)
