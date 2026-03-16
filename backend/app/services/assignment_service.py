from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.utils.get_image import get_image


class AssignmentService:

    @staticmethod
    def get_assignments(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Assignment.id)).scalar()
        assignments = (
            db.query(Assignment)
            .order_by(Assignment.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [AssignmentResponse.model_validate(a) for a in assignments],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_assignment_by_id(db: Session, assignment_id: int) -> AssignmentResponse:
        obj = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return AssignmentResponse.model_validate(obj)

    @staticmethod
    def create_assignment(
        db: Session,
        assignment_in: AssignmentCreate,
        file: Optional[UploadFile] = None,
    ) -> AssignmentResponse:
        obj = Assignment(**assignment_in.model_dump())
        if file:
            obj.file_url = get_image(file)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return AssignmentResponse.model_validate(obj)

    @staticmethod
    def update_assignment(
        db: Session,
        assignment_id: int,
        assignment_in: AssignmentUpdate,
        file: Optional[UploadFile] = None,
    ) -> AssignmentResponse:
        obj = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Assignment not found")
        for field, value in assignment_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        if file:
            obj.file_url = get_image(file)
        db.commit()
        db.refresh(obj)
        return AssignmentResponse.model_validate(obj)

    @staticmethod
    def delete_assignment(db: Session, assignment_id: int) -> dict:
        obj = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Assignment not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Assignment deleted successfully"}

    # ── Submissions ───────────────────────────────────────────────────────────

    @staticmethod
    def get_submissions(db: Session, assignment_id: int) -> list:
        if not db.query(Assignment).filter(Assignment.id == assignment_id).first():
            raise HTTPException(status_code=404, detail="Assignment not found")
        submissions = (
            db.query(Submission)
            .filter(Submission.assignment_id == assignment_id)
            .all()
        )
        return [SubmissionResponse.model_validate(s) for s in submissions]

    @staticmethod
    def submit_assignment(
        db: Session,
        assignment_id: int,
        student_id: int,
        submission_in: SubmissionCreate,
        file: Optional[UploadFile] = None,
    ) -> SubmissionResponse:
        if not db.query(Assignment).filter(Assignment.id == assignment_id).first():
            raise HTTPException(status_code=404, detail="Assignment not found")

        existing = (
            db.query(Submission)
            .filter(
                Submission.assignment_id == assignment_id,
                Submission.student_id == student_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Assignment already submitted")

        submission = Submission(
            assignment_id=assignment_id,
            student_id=student_id,
            **submission_in.model_dump(),
        )
        if file:
            submission.file_url = get_image(file)
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return SubmissionResponse.model_validate(submission)