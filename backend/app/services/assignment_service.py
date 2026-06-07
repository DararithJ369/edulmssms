from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentResponse
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.utils.get_image import get_image
from app.services.base_service import get_or_404, paginate, apply_update, delete_and_commit
from app.services.notification_helpers import notify_enrolled_students


class AssignmentService:

    @staticmethod
    def get_assignments(db: Session, page: int = 1, limit: int = 10, search: str = "") -> dict:
        query = db.query(Assignment)

        if search:
            query = query.filter(
                (Assignment.title.ilike(f"%{search}%")) |
                (Assignment.description.ilike(f"%{search}%"))
            )

        return paginate(db, Assignment, AssignmentResponse, Assignment.created_at.desc(), page, limit, query=query)

    @staticmethod
    def get_assignment_by_id(db: Session, assignment_id: int) -> AssignmentResponse:
        obj = get_or_404(db, Assignment, assignment_id, "Assignment")
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

        due_str = obj.due_date.strftime('%Y-%m-%d %H:%M') if obj.due_date else "N/A"
        notify_enrolled_students(
            db=db,
            course_id=obj.course_id,
            title="New Assignment Released",
            message=f"A new assignment '{obj.title}' has been released for course '{obj.course_name}'. Due date: {due_str}.",
            notification_type="assignment",
            reference_id=obj.id,
        )

        return AssignmentResponse.model_validate(obj)

    @staticmethod
    def update_assignment(
        db: Session,
        assignment_id: int,
        assignment_in: AssignmentUpdate,
        file: Optional[UploadFile] = None,
    ) -> AssignmentResponse:
        obj = get_or_404(db, Assignment, assignment_id, "Assignment")
        apply_update(obj, assignment_in)
        if file:
            obj.file_url = get_image(file)
        db.commit()
        db.refresh(obj)
        return AssignmentResponse.model_validate(obj)

    @staticmethod
    def delete_assignment(db: Session, assignment_id: int) -> dict:
        return delete_and_commit(db, Assignment, assignment_id, "Assignment")

    # ── Submissions ───────────────────────────────────────────────────────────

    @staticmethod
    def get_submissions(db: Session, assignment_id: int) -> list:
        get_or_404(db, Assignment, assignment_id, "Assignment")
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
        get_or_404(db, Assignment, assignment_id, "Assignment")

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

        try:
            from app.services.streak_service import StreakService
            StreakService.record_activity(db, str(student_id))
        except Exception as e:
            print(f"Failed to record streak activity on assignment submit: {e}")

        db.commit()
        db.refresh(submission)
        return SubmissionResponse.model_validate(submission)
