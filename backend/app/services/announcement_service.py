from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse


class AnnouncementService:

    @staticmethod
    def get_announcements(db: Session, page: int = 1, limit: int = 100) -> dict:
        total = db.query(func.count(Announcement.id)).scalar()
        announcements = (
            db.query(Announcement)
            .order_by(Announcement.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )
        return {
            "data": [AnnouncementResponse.model_validate(a) for a in announcements],
            "meta": {"page": page, "total": total, "limit": limit},
        }

    @staticmethod
    def get_announcement_by_id(db: Session, announcement_id: int) -> AnnouncementResponse:
        obj = db.query(Announcement).filter(Announcement.id == announcement_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Announcement not found")
        return AnnouncementResponse.model_validate(obj)

    @staticmethod
    def create_announcement(db: Session, announcement_in: AnnouncementCreate, sender_id: str) -> AnnouncementResponse:
        # Default fallback values for required fields
        data_dict = announcement_in.model_dump()
        data_dict["sender_id"] = sender_id
        
        # If course_id is not provided, try to assign to a default course (e.g. course_id=1)
        if not data_dict.get("course_id"):
            from app.models.course import Course
            first_course = db.query(Course).first()
            data_dict["course_id"] = first_course.id if first_course else 1
            
        obj = Announcement(**data_dict)
        db.add(obj)
        db.commit()
        db.refresh(obj)

        # Notify enrolled students
        try:
            from app.models.enrollment import Enrollment
            from app.services.notification_service import NotificationService
            from app.models.course import Course
            
            course = db.query(Course).filter(Course.id == obj.course_id).first()
            course_name = course.course_name if course else f"Course #{obj.course_id}"
            
            enrollments = db.query(Enrollment).filter(
                Enrollment.course_id == obj.course_id,
                Enrollment.is_active == True
            ).all()

            for enrollment in enrollments:
                if enrollment.student_profile and enrollment.student_profile.profile:
                    student_user_id = enrollment.student_profile.profile.user_id
                    if student_user_id:
                        NotificationService.create_notification(
                            db=db,
                            user_id=student_user_id,
                            title="New Course Announcement",
                            message=f"New announcement in '{course_name}': {obj.title}. Details: {obj.message}",
                            type="announcement",
                            reference_id=obj.id
                        )
        except Exception as e:
            print(f"Failed to send announcement notifications: {e}")

        return AnnouncementResponse.model_validate(obj)

    @staticmethod
    def update_announcement(
        db: Session, announcement_id: int, announcement_in: AnnouncementUpdate
    ) -> AnnouncementResponse:
        obj = db.query(Announcement).filter(Announcement.id == announcement_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Announcement not found")

        for field, value in announcement_in.model_dump(exclude_unset=True).items():
            setattr(obj, field, value)

        db.commit()
        db.refresh(obj)
        return AnnouncementResponse.model_validate(obj)

    @staticmethod
    def delete_announcement(db: Session, announcement_id: int) -> dict:
        obj = db.query(Announcement).filter(Announcement.id == announcement_id).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Announcement not found")
        db.delete(obj)
        db.commit()
        return {"detail": "Announcement deleted successfully"}
