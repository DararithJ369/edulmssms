from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.middleware.guard.permission import PermissionGuard
from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.models.enrollment import Enrollment
from app.models.result import Result
from app.models.attendance import Attendance
from app.models.course import Course
from app.services.user_profile_service import StudentProfileService
from app.schemas.user_profile import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse,
)

student_router = APIRouter(prefix="/students", tags=["Student Profiles"])

# ─────────────────────────────────────────────────────────────────────────────
# Student profile  →  /students/{user_id}/profile
# ─────────────────────────────────────────────────────────────────────────────

@student_router.get("/{user_id}/profile", response_model=StudentProfileResponse)
def get_student_profile(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user), 
):
    is_owner = current_user.id == user_id
    is_staff = current_user.is_superuser or (
        current_user.role and current_user.role.name in ["admin", "instructor", "teacher"]
    )

    if not (is_owner or is_staff):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You do not have permission to view this student profile"
        )
        
    return StudentProfileService.get_student_profile(db, user_id=user_id)


@student_router.post(
    "/{user_id}/profile",
    response_model=StudentProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_or_instructor)],
)
def create_student_profile(
    user_id: str,
    student_id: Optional[str] = Form(None),
    enrolment_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    return StudentProfileService.create_student_profile(
        db,
        user_id,
        StudentProfileCreate(
            student_id=student_id,
            enrolment_date=datetime.fromisoformat(enrolment_date) if enrolment_date else None,
        ),
    )


@student_router.put(
    "/{user_id}/profile",
    response_model=StudentProfileResponse,
    dependencies=[Depends(PermissionGuard.admin_or_instructor)],
)
def update_student_profile(
    user_id: str,
    student_id: Optional[str] = Form(None),
    enrolment_date: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    from datetime import datetime
    return StudentProfileService.update_student_profile(
        db,
        user_id,
        StudentProfileUpdate(
            student_id=student_id,
            enrolment_date=datetime.fromisoformat(enrolment_date) if enrolment_date else None,
        ),
    )


@student_router.delete(
    "/{user_id}/profile",
    dependencies=[Depends(PermissionGuard.admin_only)],
)
def delete_student_profile(user_id: str, db: Session = Depends(get_db)):
    return StudentProfileService.delete_student_profile(db, user_id)


# ─────────────────────────────────────────────────────────────────────────────
# 360° overview  →  GET /students/{user_id}/overview
# Single endpoint that aggregates all data needed for the detail page.
# ─────────────────────────────────────────────────────────────────────────────

@student_router.get("/{user_id}/overview")
def get_student_overview(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user), # 🔐 Bring current user back to the active function
):
    # 💡 SECURE INTERCEPTOR: Ensure the user has the explicit authorization rights!
    is_owner = current_user.id == user_id
    is_staff = current_user.is_superuser or (
        current_user.role and current_user.role.name in ["admin", "instructor", "teacher"]
    )

    if not (is_owner or is_staff):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You do not have permission to view this student overview dataset"
        )

    from app.models.user import User as UserModel
    from app.models.assignment import Assignment
    from app.models.exam import Exam
    from app.models.quiz import Quiz

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    profile = user.profile  
    sp = profile.student_profile if profile else None  

    # ── Parents ───────────────────────────────────────────────────────────────
    parents = []
    if sp and sp.parents:
        for p in sp.parents:
            pp = p.profile  
            parents.append({
                "id": p.id,
                "full_name": pp.full_name if pp else None,
                "relationship": p.parent_relationship,
                "phone": pp.phone if pp else None,
                "email": pp.user.email if pp and pp.user else None,
                "occupation": p.occupation,
                "emergency_phone": p.emergency_phone,
            })

    # ── Enrollments + course info ─────────────────────────────────────────────
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.student_profile_id == sp.id, Enrollment.is_active == True)
        .all()
    ) if sp else []

    courses = []
    for e in enrollments:
        c = e.course
        if not c:
            continue
        instructor_name = None
        if c.instructor and c.instructor.profile:
            instructor_name = c.instructor.profile.full_name or c.instructor.username
        elif c.instructor:
            instructor_name = c.instructor.username
        courses.append({
            "enrollment_id": e.id,
            "course_id": c.id,
            "course_name": c.course_name,
            "course_code": c.course_code,
            "category": c.category,
            "difficulty": c.difficulty,
            "instructor_name": instructor_name,
            "enrolled_date": str(e.enrolled_date) if e.enrolled_date else None,
            "is_active": e.is_active,
        })

    # ── Results ───────────────────────────────────────────────────────────────
    raw_results = (
        db.query(Result)
        .filter(Result.student_id == user_id)
        # .order_by(Result.created_at.desc())
        .limit(20)
        .all()
    )

    results = []
    total_score = 0
    total_possible = 0
    for r in raw_results:
        atype, atitle = "Unknown", "Assessment"
        if r.assignment_id:
            atype = "Assignment"
            a = db.query(Assignment).filter(Assignment.id == r.assignment_id).first()
            atitle = a.title if a else "Assignment"
        elif r.exam_id:
            atype = "Exam"
            ex = db.query(Exam).filter(Exam.id == r.exam_id).first()
            atitle = ex.title if ex else "Exam"
        elif r.quiz_id:
            atype = "Quiz"
            q = db.query(Quiz).filter(Quiz.id == r.quiz_id).first()
            atitle = q.title if q else "Quiz"

        if r.total_marks and r.total_marks > 0:
            total_score += (r.score or 0)
            total_possible += r.total_marks

        grader_name = None
        if r.graded_by:
            grader = db.query(UserModel).filter(UserModel.id == r.graded_by).first()
            if grader and grader.profile:
                grader_name = grader.profile.full_name or grader.username
            elif grader:
                grader_name = grader.username

        results.append({
            "id": r.id,
            "type": atype,
            "assessment_title": atitle,
            "score": r.score,
            "total_marks": r.total_marks,
            "percentage": round((r.score / r.total_marks) * 100, 1) if r.total_marks else None,
            "grade": r.grade,
            "is_passed": r.is_passed,
            "feedback": r.feedback,
            "grader_name": grader_name,
            "created_at": None,
        })

    avg_score = round((total_score / total_possible) * 100, 1) if total_possible > 0 else None

    # ── Attendance ────────────────────────────────────────────────────────────
    attendances = (
        db.query(Attendance)
        .filter(Attendance.student_id == user_id)
        .order_by(Attendance.date.desc())
        .all()
    )

    present = sum(1 for a in attendances if a.status == "present")
    absent  = sum(1 for a in attendances if a.status == "absent")
    late    = sum(1 for a in attendances if a.status == "late")
    total_att = present + absent + late
    att_pct = round((present / total_att) * 100, 1) if total_att > 0 else None

    recent_attendance = [
        {"date": str(a.date), "status": a.status}
        for a in attendances[:10]
    ]

    # ── Assemble ──────────────────────────────────────────────────────────────
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "image": user.image,
        },
        "profile": {
            "full_name": profile.full_name if profile else None,
            "pfp": profile.image if profile else None,
            "phone": profile.phone if profile else None,
            "address": profile.address if profile else None,
            "bio": profile.bio if profile else None,
            "date_of_birth": profile.date_of_birth if profile else None,
            "gender": profile.gender if profile else None,
            "nationality": profile.nationality if profile else None,
            "blood_type": profile.blood_type if profile else None,
            "medical_conditions": profile.medical_conditions if profile else None,
            "emergency_contact_name": profile.emergency_contact_name if profile else None,
            "emergency_contact_phone": profile.emergency_contact_phone if profile else None,
            "emergency_contact_relationship": profile.emergency_contact_relationship if profile else None,
        },
        "student_profile": {
            "student_id": sp.student_id if sp else None,
            "department": sp.department if sp else None,
            "enrolment_date": str(sp.enrolment_date) if sp and sp.enrolment_date else None,
            "grade_level": sp.grade_level.name if sp and sp.grade_level else None,
            "previous_school": sp.previous_school if sp else None,
            "scholarship_status": sp.scholarship_status if sp else None,
            "special_needs": sp.special_needs if sp else None,
        },
        "parents": parents,
        "courses": courses,
        "results": results,
        "results_summary": {
            "total": len(results),
            "average_percentage": avg_score,
            "passed": sum(1 for r in results if r["is_passed"]),
            "failed": sum(1 for r in results if r["is_passed"] is False),
        },
        "attendance": {
            "present": present,
            "absent": absent,
            "late": late,
            "total": total_att,
            "percentage": att_pct,
            "recent": recent_attendance,
        },
    }