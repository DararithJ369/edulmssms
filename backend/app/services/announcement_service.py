from sqlalchemy.orm import Session
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.services.base_service import get_or_404, paginate, apply_update, delete_and_commit
from app.services.notification_helpers import notify_enrolled_students


class AnnouncementService:

    @staticmethod
    def get_announcements(db: Session, page: int = 1, limit: int = 100) -> dict:
        return paginate(db, Announcement, AnnouncementResponse, Announcement.created_at.desc(), page, limit)

    @staticmethod
    def get_announcement_by_id(db: Session, announcement_id: int) -> AnnouncementResponse:
        obj = get_or_404(db, Announcement, announcement_id, "Announcement")
        return AnnouncementResponse.model_validate(obj)

    @staticmethod
    def create_announcement(db: Session, announcement_in: AnnouncementCreate, sender_id: str) -> AnnouncementResponse:
        data_dict = announcement_in.model_dump()
        data_dict["sender_id"] = sender_id

        if not data_dict.get("course_id"):
            from app.models.course import Course
            first_course = db.query(Course).first()
            data_dict["course_id"] = first_course.id if first_course else 1

        obj = Announcement(**data_dict)
        db.add(obj)
        db.commit()
        db.refresh(obj)

        # Notify enrolled students
        from app.models.course import Course
        course = db.query(Course).filter(Course.id == obj.course_id).first()
        course_name = course.course_name if course else f"Course #{obj.course_id}"

        notify_enrolled_students(
            db=db,
            course_id=obj.course_id,
            title="New Course Announcement",
            message=f"New announcement in '{course_name}': {obj.title}. Details: {obj.message}",
            notification_type="announcement",
            reference_id=obj.id,
        )

        return AnnouncementResponse.model_validate(obj)

    @staticmethod
    def update_announcement(
        db: Session, announcement_id: int, announcement_in: AnnouncementUpdate
    ) -> AnnouncementResponse:
        obj = get_or_404(db, Announcement, announcement_id, "Announcement")
        apply_update(obj, announcement_in)
        db.commit()
        db.refresh(obj)
        return AnnouncementResponse.model_validate(obj)

    @staticmethod
    def delete_announcement(db: Session, announcement_id: int) -> dict:
        return delete_and_commit(db, Announcement, announcement_id, "Announcement")
