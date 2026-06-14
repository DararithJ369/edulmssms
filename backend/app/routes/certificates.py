from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.config.session import get_db
from app.config.security import get_current_user
from app.models.user import User
from app.models.course import Course
from app.models.progress import StudentCourseProgress
from app.models.certificate import Certificate, StudentCertificate
from app.middleware.guard.permission import PermissionGuard

certificates_router = APIRouter(prefix="/certificates", tags=["Certificates"])

@certificates_router.get("/my-certificates")
def get_my_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the certificates claimed by the current student."""
    certs = db.query(StudentCertificate).filter(
        StudentCertificate.student_id == current_user.id
    ).all()
    
    result = []
    for c in certs:
        course = db.query(Course).filter(Course.id == c.course_id).first()
        result.append({
            "id": c.id,
            "certificate_id": c.certificate_id,
            "student_id": c.student_id,
            "course_id": c.course_id,
            "course_name": course.course_name if course else "Unknown Course",
            "course_code": course.course_code if course else "N/A",
            "issued_date": c.issued_date.isoformat() if c.issued_date else None,
            "completion_date": c.completion_date.isoformat() if c.completion_date else None,
            "credential_id": c.credential_id,
            "status": c.status
        })
    return result

@certificates_router.post("/claim/{course_id}")
def claim_certificate(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Claim a certificate for a course if 100% completed."""
    # Check if student completed the course (progress is 100%)
    progress = db.query(StudentCourseProgress).filter(
        StudentCourseProgress.student_id == current_user.id,
        StudentCourseProgress.course_id == course_id
    ).first()
    
    if not progress or progress.progress_percentage < 100.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course is not fully completed yet (progress must be 100%)."
        )
        
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found."
        )
        
    # Check if already claimed
    existing = db.query(StudentCertificate).filter(
        StudentCertificate.student_id == current_user.id,
        StudentCertificate.course_id == course_id
    ).first()
    
    if existing:
        return {
            "detail": "Certificate already claimed.",
            "certificate": {
                "id": existing.id,
                "credential_id": existing.credential_id,
                "status": existing.status
            }
        }
        
    # Find or create base Course Certificate
    base_cert = db.query(Certificate).filter(Certificate.course_id == course_id).first()
    if not base_cert:
        base_cert = Certificate(
            title=course.certificate_title or f"Certificate of Completion in {course.course_name}",
            description=course.certificate_description or f"Successfully completed {course.course_name}",
            course_id=course_id
        )
        db.add(base_cert)
        db.flush()
        
    # Generate unique credential id
    credential_id = f"CERT-{uuid.uuid4().hex[:12].upper()}"
    
    # Create Student Certificate
    student_cert = StudentCertificate(
        certificate_id=base_cert.id,
        student_id=current_user.id,
        course_id=course_id,
        completion_date=progress.completed_at or datetime.now(),
        credential_id=credential_id,
        status="Available"
    )
    
    db.add(student_cert)
    db.commit()
    db.refresh(student_cert)
    
    return {
        "id": student_cert.id,
        "credential_id": student_cert.credential_id,
        "status": student_cert.status,
        "course_name": course.course_name
    }

@certificates_router.get("/verify/{credential_id}")
def verify_certificate(
    credential_id: str,
    db: Session = Depends(get_db)
):
    """Public verification of certificate authenticity by credential ID."""
    cert = db.query(StudentCertificate).filter(
        StudentCertificate.credential_id == credential_id
    ).first()
    
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate with this credential ID was not found."
        )
        
    course = db.query(Course).filter(Course.id == cert.course_id).first()
    student = db.query(User).filter(User.id == cert.student_id).first()
    
    student_name = student.profile.full_name if student and student.profile else (student.username if student else "Unknown Student")
    course_name = course.course_name if course else "Unknown Course"
    
    # Get instructor name if available
    instructor_name = "SMS Faculty Board"
    if course and course.instructor and course.instructor.profile:
        instructor_name = course.instructor.profile.full_name
        
    return {
        "credential_id": cert.credential_id,
        "status": cert.status,
        "student_id": cert.student_id,
        "student_name": student_name,
        "course_id": cert.course_id,
        "course_name": course_name,
        "course_code": course.course_code if course else "N/A",
        "issued_date": cert.issued_date.isoformat() if cert.issued_date else None,
        "completion_date": cert.completion_date.isoformat() if cert.completion_date else None,
        "instructor_name": instructor_name
    }

@certificates_router.get("/admin/issued")
def get_all_issued_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.admin_only)
):
    """Get all issued certificates for admin management."""
    certs = db.query(StudentCertificate).all()
    result = []
    for c in certs:
        course = db.query(Course).filter(Course.id == c.course_id).first()
        student = db.query(User).filter(User.id == c.student_id).first()
        student_name = student.profile.full_name if student and student.profile else (student.username if student else "Unknown Student")
        result.append({
            "id": c.id,
            "credential_id": c.credential_id,
            "status": c.status,
            "student_id": c.student_id,
            "student_name": student_name,
            "course_id": c.course_id,
            "course_name": course.course_name if course else "Unknown Course",
            "completion_date": c.completion_date.isoformat() if c.completion_date else None
        })
    return result

@certificates_router.put("/admin/{certificate_id}/status")
def update_certificate_status(
    certificate_id: int,
    status_str: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionGuard.admin_only)
):
    """Admin endpoint to revoke, reinstate, or reissue a certificate."""
    cert = db.query(StudentCertificate).filter(StudentCertificate.id == certificate_id).first()
    if not cert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificate record not found."
        )
        
    status_str = status_str.capitalize()
    if status_str not in ["Available", "Revoked", "Pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be Available, Revoked, or Pending."
        )
        
    cert.status = status_str
    db.commit()
    db.refresh(cert)
    
    return {
        "id": cert.id,
        "credential_id": cert.credential_id,
        "status": cert.status
    }
