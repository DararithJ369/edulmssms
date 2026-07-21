from typing import Optional, List
from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.models.submission import Submission
from app.models.result import Result
from app.models.assignment import Assignment
from app.models.quiz import Quiz
from app.models.exam import Exam
from app.utils.upload_validator import validate_upload
from app.utils.cloudinary_upload import upload_to_cloudinary
from app.schemas.submission import SubmissionResponse

submission_router = APIRouter(prefix="/submissions", tags=["Submissions"])


def calculate_grade_letter(percentage: float) -> str:
    if percentage >= 90: return "A"
    elif percentage >= 80: return "B"
    elif percentage >= 70: return "C"
    elif percentage >= 60: return "D"
    elif percentage >= 50: return "E"
    return "F"


@submission_router.get("", response_model=dict, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def get_all_submissions(page: int = 1, limit: int = 10, db: Session = Depends(get_db)):
    total = db.query(Submission).count()
    submissions = db.query(Submission).order_by(Submission.submitted_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "data": [SubmissionResponse.model_validate(s) for s in submissions],
        "meta": {"page": page, "total": total, "limit": limit}
    }


@submission_router.get("/my", response_model=List[SubmissionResponse])
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    submissions = db.query(Submission).filter(Submission.student_id == current_user.id).all()
    return submissions


@submission_router.get("/reference/{sub_type}/{ref_id}", response_model=List[SubmissionResponse])
def get_submissions_by_reference(
    sub_type: str,
    ref_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Teachers can view all, students can only view their own
    query = db.query(Submission).filter(
        Submission.submission_type == sub_type,
        Submission.reference_id == ref_id
    )
    if current_user.role.name not in ["admin", "teacher", "instructor"]:
        query = query.filter(Submission.student_id == current_user.id)
    return query.all()


@submission_router.get("/{submission_id}", response_model=SubmissionResponse)
def get_submission(
    submission_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    obj = db.query(Submission).filter(Submission.id == submission_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Submission not found")
    if current_user.role.name.lower() not in ["admin", "teacher", "instructor"] and str(obj.student_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return obj


@submission_router.post("", response_model=SubmissionResponse)
async def submit_homework(
    submission_type: str = Form(...),
    reference_id: int = Form(...),
    submission_text: Optional[str] = Form(None),
    file_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id
    
    if file:
        validate_upload(file, allowed_categories=["image", "document", "video"])

    # Check if a submission already exists (allowing students to edit/resubmit before grading)
    sub = db.query(Submission).filter(
        Submission.student_id == student_id,
        Submission.submission_type == submission_type,
        Submission.reference_id == reference_id
    ).first()

    if sub and sub.status == "graded":
        raise HTTPException(status_code=400, detail="Cannot edit a submission that has already been graded.")

    # Use pre-uploaded Cloudinary URL if provided, otherwise upload file to Cloudinary
    saved_file_url = file_url
    if file and not saved_file_url:
        try:
            content_type = file.content_type or ""
            is_video = "video" in content_type
            resource_type_spec = "video" if is_video else "raw"

            saved_file_url = upload_to_cloudinary(
                file,
                folder="lms_submissions",
                resource_type=resource_type_spec,
                allowed_categories=["image", "document", "video"],
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(e)}"
            )

    if not sub:
        # Create new submission record
        sub = Submission(
            submission_type=submission_type,
            reference_id=reference_id,
            student_id=student_id,
            submission_text=submission_text,
            submission_file=saved_file_url,
            status="submitted",
            submitted_at=datetime.now()
        )
        db.add(sub)
    else:
        # Update existing submission (enables resubmission editing)
        sub.submission_text = submission_text if submission_text else sub.submission_text
        if saved_file_url:
            sub.submission_file = saved_file_url
        sub.submitted_at = datetime.now()
        sub.status = "submitted"

        # Record streak activity
        try:
            from app.services.streak_service import StreakService
            StreakService.record_activity(db, student_id)
        except Exception as e:
            print(f"Failed to record streak activity on homework submit: {e}")

    db.commit()
    db.refresh(sub)
    return sub


@submission_router.put("/{submission_id}/grade", response_model=SubmissionResponse, dependencies=[Depends(PermissionGuard.admin_or_instructor)])
def grade_submission(
    submission_id: int,
    score: float = Form(...),
    feedback: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Update submission
    sub.score = score
    sub.feedback = feedback
    sub.status = "graded"
    sub.graded_at = datetime.now()

    # Determine dynamic results gradebook mapping
    total_marks = 100
    if sub.submission_type == "assignment":
        assignment = db.query(Assignment).filter(Assignment.id == sub.reference_id).first()
        if assignment: total_marks = getattr(assignment, "total_marks", 100) or 100
    elif sub.submission_type == "quiz":
        quiz = db.query(Quiz).filter(Quiz.id == sub.reference_id).first()
        if quiz: total_marks = getattr(quiz, "total_marks", 100) or 100
    elif sub.submission_type == "exam":
        exam = db.query(Exam).filter(Exam.id == sub.reference_id).first()
        if exam: total_marks = getattr(exam, "total_marks", 100) or 100

    percentage = round((score / total_marks) * 100.0, 1)
    grade_letter = calculate_grade_letter(percentage)
    is_passed = (percentage >= 50.0)

    # Sync to gradebook Results
    result = db.query(Result).filter(
        Result.student_id == sub.student_id,
        Result.assignment_id == (sub.reference_id if sub.submission_type == "assignment" else None),
        Result.quiz_id == (sub.reference_id if sub.submission_type == "quiz" else None),
        Result.exam_id == (sub.reference_id if sub.submission_type == "exam" else None)
    ).first()

    if not result:
        result = Result(
            student_id=sub.student_id,
            assignment_id=(sub.reference_id if sub.submission_type == "assignment" else None),
            quiz_id=(sub.reference_id if sub.submission_type == "quiz" else None),
            exam_id=(sub.reference_id if sub.submission_type == "exam" else None),
            graded_by=current_user.id
        )
        db.add(result)

    result.score = int(score)
    result.total_marks = total_marks
    result.percentage = percentage
    result.grade = grade_letter
    result.feedback = feedback
    result.is_passed = is_passed
    result.graded_at = datetime.now()

    db.commit()
    db.refresh(sub)

    # Notify student about released grade
    try:
        from app.services.notification_service import NotificationService
        
        notif_msg = f"Your submission for {sub.submission_type} #{sub.reference_id} has been graded. Score: {score}/{total_marks} ({grade_letter}). Feedback: {feedback or 'None'}"
        NotificationService.create_notification(
            db=db,
            user_id=sub.student_id,
            title="Grade Released",
            message=notif_msg,
            type="grade",
            reference_id=sub.id
        )
    except Exception as e:
        print(f"Failed to send grade notification: {e}")

    return sub


@submission_router.delete("/{submission_id}", dependencies=[Depends(PermissionGuard.admin_only)])
def delete_submission(submission_id: int, db: Session = Depends(get_db)):
    obj = db.query(Submission).filter(Submission.id == submission_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Submission not found")
    db.delete(obj)
    db.commit()
    return {"detail": "Submission deleted successfully"}