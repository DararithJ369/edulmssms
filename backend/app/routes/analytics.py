from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.config.session import get_db
from app.config.security import get_current_user
from app.middleware.guard.permission import PermissionGuard
from app.models.user import User
from app.models.attendance import Attendance
from app.models.enrollment import Enrollment
from app.models.result import Result
from app.models.course import Course
from app.models.quiz import Quiz
from app.models.assignment import Assignment
from app.models.submission import Submission
from app.models.student_profile import StudentProfile
from app.models.user_profile import UserProfile

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])


@analytics_router.get("/course/{course_id}")
def get_course_analytics(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.get_current_user),
):
    """Course-level analytics for instructors/admins."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Enrolled students count
    enrolled_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.course_id == course_id, Enrollment.is_active == True
    ).scalar() or 0

    # Attendance stats
    total_attendance = db.query(func.count(Attendance.id)).filter(
        Attendance.course_id == course_id
    ).scalar() or 0
    present_count = db.query(func.count(Attendance.id)).filter(
        Attendance.course_id == course_id, Attendance.status == "present"
    ).scalar() or 0
    attendance_rate = round((present_count / total_attendance * 100), 1) if total_attendance > 0 else 0

    # Grade distribution from results
    results = db.query(Result.score, Result.total_marks, Result.percentage, Result.is_passed, Result.grade).filter(
        Result.quiz_id.in_(
            db.query(Quiz.id).filter(Quiz.course_id == course_id)
        ) | Result.assignment_id.in_(
            db.query(Assignment.id).filter(Assignment.course_id == course_id)
        )
    ).all()

    avg_grade = 0
    grade_dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
    pass_count = 0
    fail_count = 0
    if results:
        percentages = [r.percentage for r in results if r.percentage is not None]
        avg_grade = round(sum(percentages) / len(percentages), 1) if percentages else 0
        for r in results:
            g = (r.grade or "F").upper()
            if g in grade_dist:
                grade_dist[g] += 1
            if r.is_passed:
                pass_count += 1
            else:
                fail_count += 1

    # Quiz performance
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    quiz_stats = []
    for q in quizzes:
        q_results = db.query(Result).filter(Result.quiz_id == q.id).all()
        if q_results:
            q_avg = round(sum(r.percentage or 0 for r in q_results) / len(q_results), 1)
        else:
            q_avg = None
        quiz_stats.append({
            "quiz_id": q.id,
            "title": q.title,
            "attempts": len(q_results),
            "avg_percentage": q_avg,
        })

    # Assignment completion
    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).all()
    assignment_stats = []
    for a in assignments:
        sub_count = db.query(func.count(Submission.id)).filter(
            Submission.submission_type == "assignment",
            Submission.reference_id == a.id,
        ).scalar() or 0
        assignment_stats.append({
            "assignment_id": a.id,
            "title": a.title,
            "submissions": sub_count,
        })

    # At-risk students: attendance < 80% per student
    at_risk = []
    student_attendance = db.query(
        Attendance.student_id,
        func.count(Attendance.id).label("total"),
        func.sum(case((Attendance.status == "present", 1), else_=0)).label("present"),
    ).filter(
        Attendance.course_id == course_id
    ).group_by(Attendance.student_id).all()

    for sa in student_attendance:
        rate = (sa.present / sa.total * 100) if sa.total > 0 else 0
        if rate < 80:
            user = db.query(User).filter(User.id == sa.student_id).first()
            name = "Unknown"
            if user and user.profile:
                name = user.profile.full_name or user.username
            elif user:
                name = user.username
            at_risk.append({
                "student_id": sa.student_id,
                "student_name": name,
                "attendance_rate": round(rate, 1),
            })

    return {
        "course_id": course_id,
        "course_name": course.course_name,
        "enrolled_students": enrolled_count,
        "attendance_rate": attendance_rate,
        "total_attendance_records": total_attendance,
        "avg_grade_percentage": avg_grade,
        "grade_distribution": grade_dist,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "quiz_stats": quiz_stats,
        "assignment_stats": assignment_stats,
        "at_risk_students": at_risk,
    }


@analytics_router.get("/student/{student_id}")
def get_student_analytics(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student-level analytics for students, parents, or instructors."""
    # Attendance rate
    total_att = db.query(func.count(Attendance.id)).filter(
        Attendance.student_id == student_id
    ).scalar() or 0
    present_att = db.query(func.count(Attendance.id)).filter(
        Attendance.student_id == student_id, Attendance.status == "present"
    ).scalar() or 0
    attendance_rate = round((present_att / total_att * 100), 1) if total_att > 0 else 0

    # Results / GPA trend
    results = db.query(Result).filter(Result.student_id == student_id).order_by(Result.graded_at.desc()).all()
    avg_percentage = 0
    recent_results = []
    if results:
        percentages = [r.percentage for r in results if r.percentage is not None]
        avg_percentage = round(sum(percentages) / len(percentages), 1) if percentages else 0
        for r in results[:10]:
            recent_results.append({
                "id": r.id,
                "assessment_title": r.assessment_title,
                "score": r.score,
                "total_marks": r.total_marks,
                "percentage": r.percentage,
                "grade": r.grade,
                "is_passed": r.is_passed,
                "graded_at": r.graded_at.isoformat() if r.graded_at else None,
            })

    # Enrolled courses — StudentProfile links via UserProfile, not directly to user_id
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == student_id).first()
    profile = user_profile.student_profile if user_profile else None
    enrolled_courses = []
    if profile:
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_profile_id == profile.id, Enrollment.is_active == True
        ).all()
        for e in enrollments:
            course_name = e.course.course_name if e.course else f"Course #{e.course_id}"
            enrolled_courses.append({
                "course_id": e.course_id,
                "course_name": course_name,
            })

    # Pending assignments: assignments in enrolled courses without submission
    pending_assignments = []
    if profile:
        course_ids = [e.course_id for e in db.query(Enrollment).filter(
            Enrollment.student_profile_id == profile.id, Enrollment.is_active == True
        ).all()]
        if course_ids:
            assignments = db.query(Assignment).filter(Assignment.course_id.in_(course_ids)).all()
            submitted_refs = set(
                r[0] for r in db.query(Submission.reference_id).filter(
                    Submission.student_id == student_id,
                    Submission.submission_type == "assignment",
                ).all()
            )
            for a in assignments:
                if a.id not in submitted_refs:
                    pending_assignments.append({
                        "assignment_id": a.id,
                        "title": a.title,
                        "due_date": a.due_date.isoformat() if a.due_date else None,
                        "course_name": a.course_name if hasattr(a, "course_name") else f"Course #{a.course_id}",
                    })

    return {
        "student_id": student_id,
        "attendance_rate": attendance_rate,
        "total_attendance_records": total_att,
        "avg_percentage": avg_percentage,
        "total_results": len(results),
        "recent_results": recent_results,
        "enrolled_courses": enrolled_courses,
        "pending_assignments": pending_assignments,
    }


@analytics_router.get("/admin/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.admin_only),
):
    """System-wide overview for admins."""
    total_students = db.query(func.count(User.id)).filter(User.role_id == db.query(
        func.min(User.role_id)  # fallback
    )).scalar() or 0

    # Count by role
    from app.models.role import Role
    role_counts = {}
    roles = db.query(Role).all()
    for r in roles:
        count = db.query(func.count(User.id)).filter(User.role_id == r.id).scalar() or 0
        role_counts[r.name] = count

    total_courses = db.query(func.count(Course.id)).scalar() or 0
    total_enrollments = db.query(func.count(Enrollment.id)).filter(Enrollment.is_active == True).scalar() or 0

    # Overall attendance rate
    total_att = db.query(func.count(Attendance.id)).scalar() or 0
    present_att = db.query(func.count(Attendance.id)).filter(Attendance.status == "present").scalar() or 0
    attendance_rate = round((present_att / total_att * 100), 1) if total_att > 0 else 0

    # Overall grade average
    all_results = db.query(Result.percentage).filter(Result.percentage.isnot(None)).all()
    avg_grade = round(sum(r[0] for r in all_results) / len(all_results), 1) if all_results else 0

    return {
        "role_counts": role_counts,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "attendance_rate": attendance_rate,
        "total_attendance_records": total_att,
        "avg_grade_percentage": avg_grade,
        "total_results": len(all_results),
    }
