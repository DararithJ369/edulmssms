from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.class_ import Class
from app.models.class_session import ClassSession
from app.models.user import User
from app.schemas.class_ import ClassCreate, ClassUpdate, ClassResponse
from app.schemas.class_session import ClassSessionCreate, ClassSessionResponse


class ClassService:

    @staticmethod
    def get_classes(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Class.id)).scalar()
        classes = (
            db.query(Class)
            .order_by(Class.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [ClassResponse.model_validate(c) for c in classes],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_class_by_id(db: Session, class_id: int) -> ClassResponse:
        obj = db.query(Class).filter(Class.id == class_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Class not found")
        return ClassResponse.model_validate(obj)

    @staticmethod
    def create_class(db: Session, class_in: ClassCreate) -> ClassResponse:
        obj = Class(**class_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return ClassResponse.model_validate(obj)

    @staticmethod
    def update_class(db: Session, class_id: int, class_in: ClassUpdate) -> ClassResponse:
        obj = db.query(Class).filter(Class.id == class_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Class not found")
        for field, value in class_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return ClassResponse.model_validate(obj)

    @staticmethod
    def delete_class(db: Session, class_id: int) -> dict:
        obj = db.query(Class).filter(Class.id == class_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Class not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Class deleted successfully"}

    # ── Students ──────────────────────────────────────────────────────────────

    @staticmethod
    def get_class_students(db: Session, class_id: int) -> list:
        obj = db.query(Class).filter(Class.id == class_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Class not found")
        from app.schemas.user import UserResponse
        return [UserResponse.model_validate(s) for s in obj.students]

    @staticmethod
    def add_student(db: Session, class_id: int, student_id: int) -> ClassResponse:
        obj = db.query(Class).filter(Class.id == class_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Class not found")
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        if student in obj.students:
            raise HTTPException(status_code=400, detail="Student already in class")
        obj.students.append(student)
        db.commit()
        db.refresh(obj)
        return ClassResponse.model_validate(obj)

    @staticmethod
    def remove_student(db: Session, class_id: int, student_id: int) -> dict:
        obj = db.query(Class).filter(Class.id == class_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Class not found")
        student = db.query(User).filter(User.id == student_id).first()
        if not student or student not in obj.students:
            raise HTTPException(status_code=404, detail="Student not found in class")
        obj.students.remove(student)
        db.commit()
        return {"detail": "Student removed from class"}

    # ── Sessions ──────────────────────────────────────────────────────────────

    @staticmethod
    def get_class_sessions(db: Session, class_id: int) -> list:
        if not db.query(Class).filter(Class.id == class_id).first():
            raise HTTPException(status_code=404, detail="Class not found")
        sessions = (
            db.query(ClassSession)
            .filter(ClassSession.class_id == class_id)
            .order_by(ClassSession.date.asc())
            .all()
        )
        return [ClassSessionResponse.model_validate(s) for s in sessions]

    @staticmethod
    def create_session(
        db: Session, class_id: int, session_in: ClassSessionCreate
    ) -> ClassSessionResponse:
        if not db.query(Class).filter(Class.id == class_id).first():
            raise HTTPException(status_code=404, detail="Class not found")
        session = ClassSession(class_id=class_id, **session_in.model_dump())
        db.add(session)
        db.commit()
        db.refresh(session)
        return ClassSessionResponse.model_validate(session)