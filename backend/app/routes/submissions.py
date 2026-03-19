from typing import Optional
from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.services.submission_service import SubmissionService
from app.schemas.submission import SubmissionUpdate, SubmissionResponse

submission_router = APIRouter(prefix="/submissions", tags=["Submissions"])


@submission_router.get("", dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def get_all_submissions(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    return SubmissionService.get_submissions(db, page, limit)


@submission_router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(submission_id: int, db: Session = Depends(get_db)):
    return SubmissionService.get_submission_by_id(db, submission_id)


@submission_router.put("/{submission_id}", response_model=SubmissionResponse)
def update_submission(
    submission_id: int,
    content: Optional[str] = Form(None),
    score: Optional[float] = Form(None),
    feedback: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    return SubmissionService.update_submission(
        db,
        submission_id,
        SubmissionUpdate(content=content, score=score, feedback=feedback),
    )


@submission_router.delete("/{submission_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    return SubmissionService.delete_submission(db, submission_id)