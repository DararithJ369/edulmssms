from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine
from app.db.seed.base import BaseSeeder
from app.models.audit_log import AuditLog
from app.utils.colors import Colors


class AuditLogSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, AuditLog)

    def seed_audit_logs(self, admin_id: str, student_ids: list[str], instructor_ids: list[str]):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping audit log seeding")
            return []
        
        inspector = inspect(bind)
        if "audit_logs" not in set(inspector.get_table_names()):
            Colors.warning("Table 'audit_logs' does not exist, skipping audit log seeding")
            return []

        import random
        from datetime import datetime, timedelta

        logs_data = [
            {"action": "LOGIN", "message": "User admin logged in successfully.", "ip_address": "127.0.0.1", "user_agent": "macOS Safari"},
            {"action": "USER_CREATE", "message": "Created user Emma Johnson (emma@school.edu) with role ID 3.", "ip_address": "127.0.0.1", "user_agent": "macOS Chrome"},
            {"action": "USER_CREATE", "message": "Created user Dr. Sarah Chen (sarah@school.edu) with role ID 2.", "ip_address": "127.0.0.1", "user_agent": "macOS Chrome"},
            {"action": "COURSE_CREATE", "message": "Admin created new Course CS-101 (Intro to Python).", "ip_address": "192.168.1.5", "user_agent": "Windows Edge"},
            {"action": "CLASS_CREATE", "message": "Admin created new Class 'Year 1 Section A'.", "ip_address": "192.168.1.5", "user_agent": "Windows Edge"},
            {"action": "LOGIN", "message": "User teacher1 logged in successfully.", "ip_address": "10.0.0.45", "user_agent": "iPad Safari"},
            {"action": "USER_UPDATE", "message": "Updated user Liam Smith (liam@school.edu) details.", "ip_address": "127.0.0.1", "user_agent": "macOS Chrome"},
            {"action": "ATTENDANCE_SAVE", "message": "Teacher recorded attendance sheet for session CS-101.", "ip_address": "10.0.0.45", "user_agent": "iPad Safari"},
            {"action": "EXAM_CREATE", "message": "Teacher created new Exam 'Python Basics Quiz'.", "ip_address": "10.0.0.47", "user_agent": "Windows Chrome"},
            {"action": "LOGIN", "message": "User parent1 logged in successfully.", "ip_address": "172.16.5.12", "user_agent": "iPhone Mobile Safari"},
            {"action": "ASSIGNMENT_SUBMIT", "message": "Student Emma Johnson submitted Assignment 1.", "ip_address": "192.168.1.102", "user_agent": "macOS Chrome"},
            {"action": "RESULT_GRADE", "message": "Teacher graded submission for student Emma Johnson (Score: 92/100).", "ip_address": "10.0.0.45", "user_agent": "iPad Safari"},
            {"action": "ANNOUNCEMENT_CREATE", "message": "Admin published campus-wide announcement 'LMS Brief Maintenance'.", "ip_address": "127.0.0.1", "user_agent": "macOS Chrome"},
            {"action": "FINANCE_FEE_COLLECT", "message": "Admin recorded fee payment reference FE-2026-001 ($1200.0) from Emma Johnson.", "ip_address": "127.0.0.1", "user_agent": "macOS Chrome"},
            {"action": "BACKUP_RESTORE", "message": "Database schema re-seeded successfully by system runner.", "ip_address": "127.0.0.1", "user_agent": "System CLI"},
        ]

        created = []
        now = datetime.now()
        for i, data in enumerate(logs_data):
            created_at = now - timedelta(hours=i * 2, minutes=random.randint(0, 50))
            
            if data["action"] in ["LOGIN", "USER_CREATE", "CLASS_CREATE", "COURSE_CREATE", "ANNOUNCEMENT_CREATE", "FINANCE_FEE_COLLECT", "BACKUP_RESTORE"]:
                user_id = admin_id
            elif data["action"] in ["ATTENDANCE_SAVE", "EXAM_CREATE", "RESULT_GRADE"] and instructor_ids:
                user_id = instructor_ids[0]
            elif student_ids:
                user_id = student_ids[0]
            else:
                user_id = admin_id

            existing = self.db.query(AuditLog).filter_by(message=data["message"]).first()
            if existing:
                created.append(existing)
                continue

            audit_log = AuditLog(
                user_id=user_id,
                action=data["action"],
                message=data["message"],
                ip_address=data["ip_address"],
                user_agent=data["user_agent"],
                created_at=created_at
            )
            self.db.add(audit_log)
            created.append(audit_log)

        self.db.commit()
        Colors.success(f"{len(created)} audit log(s) seeded")
        return created
