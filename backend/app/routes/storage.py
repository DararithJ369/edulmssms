import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.models.submission import Submission
from app.models.assignment import Assignment
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.services.storage import StorageService

storage_router = APIRouter(prefix="/storage", tags=["Storage"])

@storage_router.get("/private/{file_path:path}")
def get_private_file(
    file_path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Standardize path: remove any leading/trailing slash or spaces
    file_path = file_path.strip().lstrip("/")
    
    # Ensure it's inside the private/ folder
    if not file_path.startswith("private/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only private assets can be accessed through this endpoint."
        )

    # 1. Admin or superuser has full access
    user_role = current_user.role.name.lower() if current_user.role else ""
    if user_role in ("admin", "superuser") or current_user.is_superuser:
        return serve_local_file(file_path)

    # 2. Determine authorization based on folder/prefix
    # Case A: Submissions (private/submissions/)
    if "submissions/" in file_path:
        submission = db.query(Submission).filter(Submission.submission_file.like(f"%{file_path}%")).first()
        if not submission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submission file not found or record does not exist."
            )
        
        # Submitting student access
        if str(submission.student_id) == str(current_user.id):
            return serve_local_file(file_path)
            
        # Parent access
        if user_role == "parent" and current_user.profile and current_user.profile.parent_profile:
            parent_profile = current_user.profile.parent_profile
            student_user_ids = [s.profile.user_id for s in parent_profile.students if s.profile]
            if str(submission.student_id) in student_user_ids:
                return serve_local_file(file_path)
                
        # Teacher/Instructor access
        # First check the reference: assignment, quiz, or exam
        course_id = None
        if submission.submission_type == "assignment":
            assignment = db.query(Assignment).filter(Assignment.id == submission.reference_id).first()
            if assignment:
                course_id = assignment.course_id
        elif submission.submission_type == "quiz":
            from app.models.quiz import Quiz
            quiz = db.query(Quiz).filter(Quiz.id == submission.reference_id).first()
            if quiz:
                course_id = quiz.course_id
        elif submission.submission_type == "exam":
            from app.models.exam import Exam
            exam = db.query(Exam).filter(Exam.id == submission.reference_id).first()
            if exam and exam.lesson and exam.lesson.module:
                course_id = exam.lesson.module.course_id
        
        if course_id:
            course = db.query(Course).filter(Course.id == course_id).first()
            if course and str(course.instructor_id) == str(current_user.id):
                return serve_local_file(file_path)

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view this submission."
        )

    # Case B: Assignment attachments (private/assignments/)
    elif "assignments/" in file_path:
        assignment = db.query(Assignment).filter(Assignment.attachment_file.like(f"%{file_path}%")).first()
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment file not found or record does not exist."
            )

        course_id = assignment.course_id
        course = db.query(Course).filter(Course.id == course_id).first()
        
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course associated with this assignment does not exist."
            )

        # Instructor access
        if str(course.instructor_id) == str(current_user.id) or str(assignment.teacher_id) == str(current_user.id):
            return serve_local_file(file_path)

        # Student enrolled access
        if user_role == "student" and current_user.profile and current_user.profile.student_profile:
            student_profile_id = current_user.profile.student_profile.id
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_profile_id == student_profile_id,
                Enrollment.course_id == course_id,
                Enrollment.is_active == True
            ).first()
            if enrollment:
                return serve_local_file(file_path)

        # Parent of enrolled student access
        if user_role == "parent" and current_user.profile and current_user.profile.parent_profile:
            parent_profile = current_user.profile.parent_profile
            student_profile_ids = [s.id for s in parent_profile.students]
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_profile_id.in_(student_profile_ids),
                Enrollment.course_id == course_id,
                Enrollment.is_active == True
            ).first()
            if enrollment:
                return serve_local_file(file_path)

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view this assignment file."
        )

    # General fallback: deny access
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: You do not have permission to access this private resource."
    )

def serve_local_file(file_path: str) -> FileResponse:
    try:
        local_path = StorageService.get_local_path(file_path)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path."
        )
    if not local_path.exists() or not local_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk."
        )
    return FileResponse(path=local_path)
