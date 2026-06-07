"""
Shared helpers for sending notifications to course-enrolled students.

Extracted from duplicated code in assignment_service.py and announcement_service.py.
"""
from __future__ import annotations

from sqlalchemy.orm import Session


def notify_enrolled_students(
    db: Session,
    course_id: int,
    title: str,
    message: str,
    notification_type: str,
    reference_id: int,
) -> None:
    """Send an in-app notification to every active student enrolled in *course_id*.

    Silently swallows exceptions so that a notification failure never
    prevents the main operation from completing.
    """
    try:
        from app.models.enrollment import Enrollment
        from app.services.notification_service import NotificationService

        enrollments = (
            db.query(Enrollment)
            .filter(Enrollment.course_id == course_id, Enrollment.is_active == True)
            .all()
        )

        for enrollment in enrollments:
            if enrollment.student_profile and enrollment.student_profile.profile:
                student_user_id = enrollment.student_profile.profile.user_id
                if student_user_id:
                    NotificationService.create_notification(
                        db=db,
                        user_id=student_user_id,
                        title=title,
                        message=message,
                        type=notification_type,
                        reference_id=reference_id,
                    )
    except Exception as e:
        print(f"Failed to send {notification_type} notifications: {e}")
