from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.announcement import Announcement
from app.utils.colors import Colors


class AnnouncementSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Announcement)

    def seed_announcements(self, courses: list, instructor_ids: list[str], admin_id: str):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping announcement seeding")
            return []
        inspector = inspect(bind)
        if "announcements" not in set(inspector.get_table_names()):
            Colors.warning("Table 'announcements' does not exist, skipping announcement seeding")
            return []

        def get_instructor(index: int) -> str:
            if not instructor_ids:
                return None
            if index < len(instructor_ids):
                return instructor_ids[index]
            return instructor_ids[0]

        created = []
        for course in courses:
            course_id = course.id
            if course.course_code == "CS-205":
                announcements_data = [
                    {
                        "title": "FastAPI Project Submission Guidelines",
                        "message": "Dear Web Development Students, please ensure your task manager REST APIs strictly enforce Pydantic body validation. Use BaseModel fields for parameter verification and return detailed validation errors. Submit your GitHub links on the portal.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": get_instructor(0),  # Dr. Sarah Chen
                        "course_id": course_id,
                        "is_read": False,
                    },
                    {
                        "title": "Google UX Engineer Guest Lecture",
                        "message": "Join us this Friday at 2:00 PM in Lab 103 for an interactive guest workshop on 'CSS Subgrids and Container Queries in Production' presented by a Staff UX Engineer from Google. Attendance is highly encouraged!",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": get_instructor(0),  # Dr. Sarah Chen
                        "course_id": course_id,
                        "is_read": False,
                    },
                ]
            elif course.course_code == "CS-101":
                announcements_data = [
                    {
                        "title": "Optional Midterm Review Session",
                        "message": "An optional review session covering list comprehensions, dictionary lookups, positional arguments, and indentation scope rules will be held in Lab 204 tomorrow at 3:00 PM. The session will be recorded.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": get_instructor(1),  # Prof. Michael Johnson
                        "course_id": course_id,
                        "is_read": False,
                    },
                    {
                        "title": "Python requests & BeautifulSoup Guidelines",
                        "message": "When writing your technical news scraper for Assignment 3, please remember to specify a user-agent header in your request blocks and introduce brief sleep pauses to prevent getting rate-limited.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": get_instructor(1),  # Prof. Michael Johnson
                        "course_id": course_id,
                        "is_read": False,
                    },
                ]
            else:
                announcements_data = []

            # Add a system-wide general announcement for each course block
            announcements_data.append({
                "title": "LMS Platform Upgrades & Brief Maintenance",
                "message": "Dear faculty and student body, our LMS platform will undergo a brief system optimization and library migration this coming Saturday from 11:00 PM to 1:00 AM. Expect occasional 5-minute offline periods.",
                "type": "general",
                "recipient_id": "all",
                "sender_id": admin_id,
                "course_id": course_id,
                "is_read": False,
            })

            for data in announcements_data:
                existing = self.db.query(Announcement).filter_by(title=data["title"], course_id=course_id).first()
                if existing:
                    created.append(existing)
                    continue

                announcement = self.create_one(lambda d=data: d, skip_if_exists=False)
                if announcement:
                    created.append(announcement)

        self.db.commit()
        Colors.success(f"{len(created)} announcement(s) seeded")
        return created
