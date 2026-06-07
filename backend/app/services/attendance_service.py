from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.attendance import Attendance
from app.models.class_session import ClassSession
from app.models.user import User
from app.schemas.attendance import AttendanceBulkCreate, AttendanceUpdate, AttendanceResponse, AttendanceCreate


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
        record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        for field, value in attendance_in.model_dump(exclude_unset=True).items():
            setattr(record, field, value)
        db.commit()
        db.refresh(record)
        return AttendanceResponse.model_validate(record)

    @staticmethod
    def get_all_attendance(
        db: Session, page: int = 1, limit: int = 10, search: str = "", current_user = None
    ) -> dict:
        query = db.query(Attendance)
        
        # Role-based filtering
        if current_user:
            role = current_user.role.name.lower()
            if role == "student":
                query = query.filter(Attendance.student_id == current_user.id)
            elif role == "parent":
                if current_user.profile and current_user.profile.parent_profile:
                    student_user_ids = [
                        s.profile.user_id for s in current_user.profile.parent_profile.students 
                        if s.profile
                    ]
                    query = query.filter(Attendance.student_id.in_(student_user_ids))
                else:
                    return {
                        "data": [],
                        "meta": {"page": page, "total": 0, "limit": limit},
                    }
        
        if search:
            from app.models.user_profile import UserProfile
            query = query.join(UserProfile, Attendance.student_id == UserProfile.user_id).filter(
                (UserProfile.full_name.ilike(f"%{search}%")) |
                (Attendance.status.ilike(f"%{search}%"))
            )
        
        total = query.with_entities(func.count(Attendance.id)).scalar()
        records = (
            query.order_by(Attendance.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        
        return {
            "data": [AttendanceResponse.model_validate(r) for r in records],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def delete_attendance(db: Session, attendance_id: int) -> dict:
        record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not record:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        db.delete(record)
        db.commit()
        return {"message": "Attendance record deleted successfully"}

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