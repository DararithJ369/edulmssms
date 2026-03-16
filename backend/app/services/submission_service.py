from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.submission import Submission
from app.schemas.submission import SubmissionUpdate, SubmissionResponse


class SubmissionService:

    @staticmethod
    def get_submissions(db: Session, page: int = 1, limit: int = 10) -> dict:
        total = db.query(func.count(Submission.id)).scalar()
        submissions = (
            db.query(Submission)
            .order_by(Submission.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [SubmissionResponse.model_validate(s) for s in submissions],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_submission_by_id(db: Session, submission_id: int) -> SubmissionResponse:
        obj = db.query(Submission).filter(Submission.id == submission_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Submission not found")
        return SubmissionResponse.model_validate(obj)

    @staticmethod
    def update_submission(
        db: Session, submission_id: int, submission_in: SubmissionUpdate
    ) -> SubmissionResponse:
        """Used by teachers to add score/feedback or students to edit their submission."""
        obj = db.query(Submission).filter(Submission.id == submission_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Submission not found")
        for field, value in submission_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)
        db.commit()
        db.refresh(obj)
        return SubmissionResponse.model_validate(obj)

    @staticmethod
    def delete_submission(db: Session, submission_id: int) -> dict:
        obj = db.query(Submission).filter(Submission.id == submission_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Submission not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Submission deleted successfully"}