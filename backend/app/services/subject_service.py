from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.subject import Subject
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse


class SubjectService:
    
    @staticmethod
    def setup_form(db: Session) -> dict:
        from app.models.role import Role
        teachers = db.query(User).join(Role).filter(Role.name.in_(["teacher", "instructor"]), User.is_active == True).all()
        teacher_options = [{"value": t.id, "label": f"{t.username} ({t.email})"} for t in teachers]
        return {
            "fields": {
                "teacher_id": {"type": "select", "options": teacher_options, "required": True},
                "name": {"type": "string", "required": True},
                "code": {"type": "string", "required": False, "hint": "e.g. MTH101"},
                "description": {"type": "text", "required": False},
                "credits": {"type": "number", "required": False, "default": 3},
                "hours_per_week": {"type": "number", "required": False},
                "is_active": {"type": "boolean", "required": False},
            }
        }

    @staticmethod
    def get_subjects(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Subject.id)).scalar()
        subjects = (
            db.query(Subject)
            .order_by(Subject.name.asc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [SubjectResponse.model_validate(s) for s in subjects],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_subject_by_id(db: Session, subject_id: int) -> SubjectResponse:
        obj = db.query(Subject).filter(Subject.id == subject_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Subject not found")
        return SubjectResponse.model_validate(obj)

    @staticmethod
    def setup_form(db: Session) -> dict:
        from app.models.role import Role
        teachers = db.query(User).join(Role).filter(Role.name.in_(["teacher", "instructor"]), User.is_active == True).all()
        teacher_options = [{"value": t.id, "label": f"{t.username} ({t.email})"} for t in teachers]
        return {
            "fields": {
                "teacher_id": {"type": "select", "options": teacher_options, "required": True},
                "name": {"type": "string", "required": True},
                "code": {"type": "string", "required": False, "hint": "e.g. MTH101"},
                "description": {"type": "text", "required": False},
                "credits": {"type": "number", "required": False, "default": 3},
                "hours_per_week": {"type": "number", "required": False},
                "is_active": {"type": "boolean", "required": False},
            }
        }

    @staticmethod
    def create_subject(db: Session, subject_in: SubjectCreate) -> SubjectResponse:
        if db.query(Subject).filter(func.lower(Subject.name) == subject_in.name.lower()).first():
            raise HTTPException(status_code=400, detail="Subject name already exists")

        teacher = db.query(User).filter(User.id == subject_in.instructor_id).first()
        if not teacher:
            raise HTTPException(status_code=400, detail="Teacher not found")

        obj = Subject(**subject_in.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return SubjectResponse.model_validate(obj)

    @staticmethod
    def update_subject(db: Session, subject_id: int, subject_in: SubjectUpdate) -> SubjectResponse:
        obj = db.query(Subject).filter(Subject.id == subject_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Subject not found")

        if subject_in.name:
            conflict = (
                db.query(Subject)
                .filter(func.lower(Subject.name) == subject_in.name.lower(), Subject.id != subject_id)
                .first()
            )
            if conflict:
                raise HTTPException(status_code=400, detail="Subject name already exists")

        if subject_in.instructor_id:
            if not db.query(User).filter(User.id == subject_in.instructor_id).first():
                raise HTTPException(status_code=400, detail="Teacher not found")

        for field, value in subject_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)

        db.commit()
        db.refresh(obj)
        return SubjectResponse.model_validate(obj)

    @staticmethod
    def delete_subject(db: Session, subject_id: int) -> dict:
        obj = db.query(Subject).filter(Subject.id == subject_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Subject not found")

        if obj.courses:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete subject with existing courses. Reassign or delete courses first.",
            )

        db.delete(obj)
        db.commit()
        return {"detail": "Subject deleted successfully"}

    @staticmethod
    def get_subject_courses(db: Session, subject_id: int) -> list:
        obj = db.query(Subject).filter(Subject.id == subject_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Subject not found")
        from app.schemas.course import CourseResponse
        return [CourseResponse.model_validate(c) for c in obj.courses]