from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.config.session import get_db
from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.course import Course
from app.models.result import Result
from app.models.attendance import Attendance
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.middleware.guard.permission import PermissionGuard

dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@dashboard_router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user)
):
    """Get dashboard statistics for the current user"""
    
    role = current_user.role.name.lower()
    
    # --- ADMIN STATS ---
    if role == "admin":
        total_users = db.query(User).count()
        total_enrollments = db.query(Enrollment).count()
        total_courses = db.query(Course).count()
        
        results = db.query(Result).all()
        average_score = (
            sum([r.score for r in results if r.score]) / len([r for r in results if r.score])
            if results and any(r.score for r in results)
            else 0
        )
        
        return {
            "total_users": total_users,
            "total_enrollments": total_enrollments,
            "total_courses": total_courses,
            "average_score": round(average_score, 2),
            "user_enrollments": total_enrollments,
        }
    
    # --- TEACHER STATS ---
    elif role == "teacher":
        total_courses = db.query(Course).count()
        
        # Count enrollments for courses taught by this teacher
        user_enrollments = db.query(Enrollment).join(Course).filter(
            Course.instructor_id == current_user.id
        ).count()
        
        results = db.query(Result).all()
        average_score = (
            sum([r.score for r in results if r.score]) / len([r for r in results if r.score])
            if results and any(r.score for r in results)
            else 0
        )
        
        return {
            "total_courses": total_courses,
            "user_enrollments": user_enrollments,
            "average_score": round(average_score, 2),
            "total_users": db.query(User).count(),
        }
    
    # --- STUDENT STATS ---
    else:  # student
        student_profile = current_user.student_profile
        
        if not student_profile:
            return {
                "user_enrollments": 0,
                "average_score": 0,
                "total_users": db.query(User).count(),
                "total_courses": db.query(Course).count(),
            }
        
        # Student enrollments
        user_enrollments = db.query(Enrollment).filter_by(
            student_profile_id=student_profile.id
        ).count()
        
        # Student average score
        results = db.query(Result).filter_by(
            student_profile_id=student_profile.id
        ).all()
        average_score = (
            sum([r.score for r in results if r.score]) / len([r for r in results if r.score])
            if results and any(r.score for r in results)
            else 0
        )
        
        # Student attendance percentage
        attendances = db.query(Attendance).filter_by(
            student_profile_id=student_profile.id
        ).all()
        present_count = len([a for a in attendances if a.status == "present"])
        attendance_percentage = (
            (present_count / len(attendances)) * 100 if attendances else 0
        )
        
        return {
            "user_enrollments": user_enrollments,
            "average_score": round(average_score, 2),
            "attendance_percentage": round(attendance_percentage, 2),
            "total_users": db.query(User).count(),
            "total_courses": db.query(Course).count(),
        }
