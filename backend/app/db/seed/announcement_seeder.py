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

        def get_instructor_id(course_idx: int) -> str:
            if not instructor_ids:
                return None
            return instructor_ids[course_idx % len(instructor_ids)]

        created = []
        for course_idx, course in enumerate(courses):
            course_id = course.id
            course_code = course.course_code
            instructor_id = course.instructor_id or get_instructor_id(course_idx)

            announcements_data = []

            # Course-specific announcements
            if course_code == "DS-210":
                announcements_data = [
                    {
                        "title": "DBMS Project Normalization Check",
                        "message": "Dear Database students, please ensure your design submissions are normalized up to 3NF. Document functional dependencies and highlight candidate keys in your structural reports.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": instructor_id,
                        "course_id": course_id,
                        "is_read": False,
                    },
                    {
                        "title": "EXPLAIN ANALYZE Workshop",
                        "message": "We will have an optional lab session this Friday at 10:00 AM on query execution plans and database indexes. We will compare query speeds with and without B-Tree indexes.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": instructor_id,
                        "course_id": course_id,
                        "is_read": False,
                    },
                ]
            elif course_code == "IT-201":
                announcements_data = [
                    {
                        "title": "FastAPI REST API Submission Guidelines",
                        "message": "When submitting your web task API manager, make sure your routers enforce type validation using Pydantic schemas. Write unit test cases for the validation rules.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": instructor_id,
                        "course_id": course_id,
                        "is_read": False,
                    },
                    {
                        "title": "Next.js App Router Masterclass",
                        "message": "A guest lecture on React Server Components, hydration states, and middleware-based authorization will be held online via Zoom this Saturday at 2:00 PM.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": instructor_id,
                        "course_id": course_id,
                        "is_read": False,
                    },
                ]
            elif course_code == "DS-301":
                announcements_data = [
                    {
                        "title": "Gradient Descent Math Refresher",
                        "message": "Please review multivariate partial derivatives and matrix calculations prior to next Monday's lecture. We will trace backpropagation updates mathematically.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": instructor_id,
                        "course_id": course_id,
                        "is_read": False,
                    }
                ]
            elif course_code == "CS-101":
                announcements_data = [
                    {
                        "title": "BeautifulSoup Scraper Guidelines",
                        "message": "Ensure your scrapers introduce sleep delays (time.sleep) between requests and specify a User-Agent header in request headers to prevent getting rate-limited.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": instructor_id,
                        "course_id": course_id,
                        "is_read": False,
                    }
                ]
            else:
                announcements_data = [
                    {
                        "title": f"Course Guidelines: {course.course_name}",
                        "message": f"Welcome to {course.course_name}. Please review the course modules list and timeline items. Make sure to complete assignments on time.",
                        "type": "course-specific",
                        "recipient_id": str(course_id),
                        "sender_id": instructor_id,
                        "course_id": course_id,
                        "is_read": False,
                    }
                ]

            # System-wide announcement
            announcements_data.append({
                "title": "Final Examination Timetable and Venues",
                "message": "Dear university body, the official Semester I Final Examination timetable has been published on the Academic board. Please review exam dates, duration times, and lab venues.",
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
