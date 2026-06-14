import argparse
import importlib
import sys
from pathlib import Path
from sqlalchemy import text
from datetime import datetime, date

if __package__ in {None, ""}:
    backend_root = Path(__file__).resolve().parents[3]
    backend_root_str = str(backend_root)
    if backend_root_str not in sys.path:
        sys.path.insert(0, backend_root_str)

from app.config.session import local_session
from app.db.seed.role_seeder import RoleSeeder
from app.db.seed.user_seeder import UserSeeder
from app.db.seed.profile_seeder import ProfileSeeder
from app.db.seed.class_seeder import ClassSeeder
from app.db.seed.academic_year_seeder import AcademicYearSeeder
from app.db.seed.grade_level_seeder import GradeLevelSeeder
from app.db.seed.subject_seeder import SubjectSeeder
from app.db.seed.course_seeder import CourseSeeder
from app.db.seed.module_seeder import ModuleSeeder
from app.db.seed.lesson_seeder import LessonSeeder
from app.db.seed.assignment_seeder import AssignmentSeeder
from app.db.seed.enrollment_seeder import EnrollmentSeeder
from app.db.seed.attendance_seeder import AttendanceSeeder
from app.db.seed.quiz_seeder import QuizSeeder
from app.db.seed.exam_seeder import ExamSeeder
from app.db.seed.result_seeder import ResultSeeder
from app.db.seed.submission_seeder import SubmissionSeeder
from app.db.seed.announcement_seeder import AnnouncementSeeder
from app.db.seed.finance_seeder import FinanceSeeder
from app.db.seed.audit_log_seeder import AuditLogSeeder
from app.db.seed.schedule_slot_seeder import ScheduleSlotSeeder
from app.db.seed.event_seeder import EventSeeder
from app.utils.colors import Colors


from alembic.config import Config
from alembic import command

def ensure_seed_tables(db):
    # Import all models to register them with SQLAlchemy
    from app.db.base import Base
    
    model_modules = [
        "app.models.role", "app.models.user", "app.models.user_profile", "app.models.class_",
        "app.models.grade_level", "app.models.subject", "app.models.course", "app.models.lesson_material",
        "app.models.assignment", "app.models.enrollment", "app.models.attendance", "app.models.quiz",
        "app.models.exam", "app.models.result", "app.models.submission", "app.models.instructor_profile",
        "app.models.student_profile", "app.models.parent_profile", "app.models.finance", "app.models.audit_log",
        "app.models.schedule_slot", "app.models.event"
    ]
    
    for module_name in model_modules:
        try:
            importlib.import_module(module_name)
        except ImportError:
            pass
    
    try:
        # Safely wipe schema tables using clean DDL execution
        db.connection().connection.set_isolation_level(0)  # autocommit mode
        db.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        db.execute(text("CREATE SCHEMA public"))
        db.connection().connection.set_isolation_level(1)  # back to normal
        Colors.success("Database schema wiped clean")
    except Exception as e:
        Colors.warning(f"Could not reset schema: {e}")
    
    db.commit()
    
    try:
        Colors.info("Building schema using Base.metadata.create_all...")
        Base.metadata.create_all(bind=db.get_bind())
        
        Colors.info("Initializing alembic_version table to latest head (dd45db2ba7e5)...")
        db.execute(text("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"))
        db.execute(text("INSERT INTO alembic_version (version_num) VALUES ('dd45db2ba7e5')"))
        db.commit()
        Colors.success("Database schema successfully generated and aligned with Alembic")
    except Exception as e:
        Colors.error(f"Schema generation failed: {e}")


def main():
    parser = argparse.ArgumentParser(description="LMS + SMS Seeder CLI")
    parser.add_argument("command", choices=["seed", "reset", "reset-seed"], help="Seeder command")
    args = parser.parse_args()

    if args.command == "reset-seed":
        db_temp = local_session()
        try:
            ensure_seed_tables(db_temp)
            args.command = "seed"
        finally:
            db_temp.close()

    db = local_session()

    try:
        if args.command == "seed":
            # 1. Seed Roles & Grade Levels
            role_seeder = RoleSeeder(db)
            grade_level_seeder = GradeLevelSeeder(db)
            
            roles = role_seeder.seed_roles()
            grade_levels = grade_level_seeder.seed_grade_levels()

            admin_role = roles.get("admin")
            instructor_role = roles.get("instructor")
            student_role = roles.get("student")
            parent_role = roles.get("parent")

            # 2. Seed User Accounts
            user_seeder = UserSeeder(db)
            admin = user_seeder.seed_admin(admin_role.id) if admin_role else None
            instructors = user_seeder.seed_instructors(instructor_role.id, count=20) if instructor_role else []
            students = user_seeder.seed_students(student_role.id, count=200) if student_role else []
            parents = user_seeder.seed_parents(parent_role.id, count=50) if parent_role else []

            admin_id = admin.id if admin else None
            instructor_ids = [inst.id for inst in instructors]
            student_ids = [std.id for std in students]
            parent_ids = [p.id for p in parents]

            # 3. Seed Class Sections (8 classes total: Y1-A, Y1-B, Y2-A, Y2-B, Y3-A, Y3-B, Y4-A, Y4-B)
            class_seeder = ClassSeeder(db)
            classes_list = []
            
            # Map grade level name to classes
            grade_map = {gl.name: gl for gl in grade_levels}
            
            sections = ["A", "B"]
            year_levels = ["Year 1", "Year 2", "Year 3", "Year 4"]
            
            class_idx = 0
            for yr in year_levels:
                gl = grade_map.get(yr)
                if not gl:
                    continue
                for sec in sections:
                    # Assign a teacher as supervisor/advisor
                    supervisor_id = instructor_ids[class_idx % len(instructor_ids)]
                    cls = class_seeder.seed_class(
                        section=sec,
                        supervisor_id=supervisor_id,
                        grade_id=gl.id,
                        academic_year="2025-26"
                    )
                    if cls:
                        classes_list.append(cls)
                        class_idx += 1

            # 4. Seed UserProfile records
            profile_seeder = ProfileSeeder(db)
            
            # A. Admin Profile
            if admin:
                profile_seeder.seed_profile(admin.id, "System Administrator", gender="MALE")

            # B. Instructor Profiles
            instructor_names = [
                "Dr. Seng Dararith", "Prof. Chhim Vutha", "Dr. Keo Sophal", "Prof. Lim Socheata", "Dr. Chan Somally",
                "Prof. Nguon Chanbora", "Dr. Sok Chenda", "Prof. Tep Moniphal", "Dr. Chea Sopheap", "Prof. Meas Serey",
                "Dr. Ros Sarath", "Prof. Khorn Sovann", "Dr. Khun Borin", "Prof. Long Samedy", "Dr. Ouk Vutha",
                "Prof. Seng Vanna", "Dr. Touch Sophanha", "Prof. Yim Pich", "Dr. Keo Rasmey", "Prof. Hang Chunon"
            ]
            for i, inst in enumerate(instructors):
                inst_name = instructor_names[i] if i < len(instructor_names) else f"Instructor {inst.username}"
                inst_gender = "FEMALE" if i in [3, 4, 6, 8, 9, 11] else "MALE"
                profile_seeder.seed_profile(inst.id, inst_name, gender=inst_gender)

            # C. Student Profiles (distribute across classes and link to grade levels)
            family_names = [
                "Sok", "Heng", "Pich", "Chan", "Keo", "Seng", "Chea", "Meas", "Ros", "Khorn", 
                "Lim", "Tep", "Yim", "Nguon", "Ouk", "Touch", "Long", "Khun", "Chhim", "Sam", 
                "Phan", "Rith", "Vong", "Ung", "Mao"
            ]
            given_names = [
                "Dararith", "Vutha", "Chenda", "Sophal", "Socheata", "Somally", "Samnang", "Serey", "Rasmey", "Both", 
                "Sovann", "Boren", "Vanna", "Sophanha", "Piseth", "Samedy", "Roth", "Sreyroth", "Kimheng", "Chanraksmey", 
                "Samphors", "Chantha", "Sreypich", "Borin", "Dara"
            ]
            for i, std in enumerate(students):
                first = family_names[i % len(family_names)]
                last = given_names[(i // len(family_names)) % len(given_names)]
                std_name = f"{first} {last}"
                
                # Distribute students across classes: i % 8
                target_class = classes_list[i % len(classes_list)] if classes_list else None
                class_id = target_class.id if target_class else None
                
                # Alternate student genders to match 60/40 ratio
                std_gender = "MALE" if i % 5 < 3 else "FEMALE"
                profile_seeder.seed_profile(std.id, std_name, class_id, gender=std_gender)

            # D. Parent Profiles
            parent_names = [
                "Heng Sovann", "Sok Phalla", "Pich Sophea", "Chea Rithy", "Meas Veasna", "Ros Vannak", "Lim Sarith", "Tep Phirum", "Yim Socheat", "Nguon Chantra",
                "Ouk Kosod", "Touch Vicheka", "Chhim Nara", "Sam Darith", "Phan Mony", "Ung Nika", "Mao Seyha", "Keo Vanny", "Seng Bora", "Long Cheat"
            ]
            for i, p in enumerate(parents):
                p_name = parent_names[i % len(parent_names)] + f" (Parent {i+1})"
                p_gender = "FEMALE" if i % 2 == 0 else "MALE"
                profile_seeder.seed_profile(p.id, p_name, gender=p_gender)

            db.commit()

            # 5. Populate profile extensions (StudentProfile, ParentProfile, InstructorProfile)
            from app.models.student_profile import StudentProfile
            from app.models.parent_profile import ParentProfile
            from app.models.instructor_profile import InstructorProfile
            from app.models.user_profile import UserProfile
            
            # A. Student Profiles Extension
            student_user_profiles = db.query(UserProfile).filter(UserProfile.user_id.in_(student_ids)).order_by(UserProfile.user_id.asc()).all()
            for idx, up in enumerate(student_user_profiles, start=1):
                existing_sp = db.query(StudentProfile).filter_by(profile_id=up.id).first()
                if not existing_sp:
                    # Sync GradeLevel with Class Section grade_id
                    class_obj = up.class_
                    grade_level_id = class_obj.grade_id if class_obj else 1
                    
                    sp = StudentProfile(
                        profile_id=up.id,
                        student_id=f"e2026{idx:04d}",
                        department=class_obj.grade_level.description if class_obj else "Computer Science",
                        grade_level_id=grade_level_id,
                        enrolment_date=date.today(),
                        scholarship_status="None",
                        previous_school="Phnom Penh High School"
                    )
                    db.add(sp)
            db.commit()

            # B. Parent Profiles Extension
            parent_user_profiles = db.query(UserProfile).filter(UserProfile.user_id.in_(parent_ids)).all()
            parent_occupations = ["Engineer", "Teacher", "Physician", "Entrepreneur", "Accountant"]
            parent_relationships = ["Father", "Mother", "Guardian", "Father", "Mother"]
            for idx, up in enumerate(parent_user_profiles):
                existing_pp = db.query(ParentProfile).filter_by(profile_id=up.id).first()
                if not existing_pp:
                    pp = ParentProfile(
                        profile_id=up.id,
                        emergency_phone=f"01234567{idx:02d}",
                        occupation=parent_occupations[idx % len(parent_occupations)],
                        parent_relationship=parent_relationships[idx % len(parent_relationships)]
                    )
                    db.add(pp)
            db.commit()

            # C. Instructor Profiles Extension
            instructor_user_profiles = db.query(UserProfile).filter(UserProfile.user_id.in_(instructor_ids)).all()
            instructor_departments = ["Computer Science", "Software Engineering", "Information Technology", "Data Science", "Applied Mathematics"]
            instructor_positions = ["Professor", "Associate Professor", "Senior Lecturer", "Lecturer"]
            for idx, up in enumerate(instructor_user_profiles):
                existing_ip = db.query(InstructorProfile).filter_by(profile_id=up.id).first()
                if not existing_ip:
                    ip = InstructorProfile(
                        profile_id=up.id,
                        department=instructor_departments[idx % len(instructor_departments)],
                        position=instructor_positions[idx % len(instructor_positions)],
                        office=f"Building A, Room {100+idx}",
                        hire_date="2020-09-01"
                    )
                    db.add(ip)
            db.commit()

            # D. Parent-Student Association Linkage (Sibling Simulation)
            student_profiles = db.query(StudentProfile).order_by(StudentProfile.id.asc()).all()
            parent_profiles = db.query(ParentProfile).order_by(ParentProfile.id.asc()).all()
            if student_profiles and parent_profiles:
                for idx, student_profile in enumerate(student_profiles):
                    parent_profile = parent_profiles[idx % len(parent_profiles)]
                    if student_profile not in parent_profile.students:
                        parent_profile.students.append(student_profile)
            db.commit()

            # 6. Seed Academic Years & Terms
            academic_year_seeder = AcademicYearSeeder(db)
            academic_years = academic_year_seeder.seed_academic_years()
            academic_year_id = academic_years[0].id if academic_years else 1

            # 7. Seed Subjects
            subject_seeder = SubjectSeeder(db)
            subjects = subject_seeder.seed_subjects(instructor_ids)

            # 8. Seed Courses
            course_seeder = CourseSeeder(db)
            courses = course_seeder.seed_courses(instructor_ids, subjects)

            # 9. Seed Modules
            module_seeder = ModuleSeeder(db)
            modules = module_seeder.seed_modules(courses)

            # 10. Seed Lessons & Materials
            lesson_seeder = LessonSeeder(db)
            lessons = lesson_seeder.seed_lessons(modules)

            # 11. Seed Course Enrollments
            enrollment_seeder = EnrollmentSeeder(db)
            enrollments = enrollment_seeder.seed_enrollments(courses, student_profiles, academic_year_id)

            # 12. Seed Assignments
            assignment_seeder = AssignmentSeeder(db)
            assignments = assignment_seeder.seed_assignments(courses, instructor_ids)

            # 13. Seed Quizzes + MCQ Questions
            quiz_seeder = QuizSeeder(db)
            quizzes = quiz_seeder.seed_quizzes(courses, instructor_ids)

            # 14. Seed Exams
            exam_seeder = ExamSeeder(db)
            exams = exam_seeder.seed_exams(lessons, instructor_ids)

            # 15. Seed Attendance Logs
            attendance_seeder = AttendanceSeeder(db)
            attendance_seeder.seed_attendance(courses, instructor_ids)

            # 16. Seed Coursework Submissions
            submission_seeder = SubmissionSeeder(db)
            submissions = submission_seeder.seed_submissions(student_ids, assignments, quizzes, exams)

            # 17. Seed Graded Results on Bell Curve
            result_seeder = ResultSeeder(db)
            result_seeder.seed_results(student_ids, instructor_ids)

            # 17.5 Seed Student Course Progress & Certificates for Demo
            from app.models.certificate import Certificate, StudentCertificate
            from app.models.progress import StudentCourseProgress
            from app.models.enrollment import Enrollment
            import uuid
            
            # Select first 20 enrollments
            enrolls = db.query(Enrollment).limit(20).all()
            for idx, e in enumerate(enrolls):
                student_id = e.student_profile.profile.user_id
                course_id = e.course_id
                
                # Check progress record
                prog = db.query(StudentCourseProgress).filter_by(student_id=student_id, course_id=course_id).first()
                if not prog:
                    prog = StudentCourseProgress(
                        student_id=student_id,
                        course_id=course_id,
                        progress_percentage=100.0,
                        completed_lessons=4,
                        completed_modules=2,
                        completed_at=datetime.now()
                    )
                    db.add(prog)
                    db.flush()
                
                # Check base certificate
                base_cert = db.query(Certificate).filter_by(course_id=course_id).first()
                if not base_cert:
                    base_cert = Certificate(
                        title=e.course.certificate_title or f"Certificate of Completion in {e.course.course_name}",
                        description=e.course.certificate_description or f"Successfully completed {e.course.course_name}",
                        course_id=course_id
                    )
                    db.add(base_cert)
                    db.flush()
                
                # Create student certificate
                existing = db.query(StudentCertificate).filter_by(student_id=student_id, course_id=course_id).first()
                if not existing:
                    student_cert = StudentCertificate(
                        certificate_id=base_cert.id,
                        student_id=student_id,
                        course_id=course_id,
                        completion_date=datetime.now(),
                        credential_id=f"CERT-{uuid.uuid4().hex[:12].upper()}",
                        status="Available"
                    )
                    db.add(student_cert)
            db.commit()
            Colors.success("Successfully seeded 20 student certificates and 100% course completions")

            # 18. Seed Course Announcements
            announcement_seeder = AnnouncementSeeder(db)
            announcement_seeder.seed_announcements(courses, instructor_ids, admin_id)

            # 19. Seed Finance Records
            finance_seeder = FinanceSeeder(db)
            finance_seeder.seed_finance()

            # 20. Seed Schedules & Calendar Events (per class section)
            schedule_slot_seeder = ScheduleSlotSeeder(db)
            event_seeder = EventSeeder(db)
            for cls in classes_list:
                schedule_slot_seeder.seed_schedule_slots(cls.id, instructor_ids, subjects)
                event_seeder.seed_events(cls.id)

            # 21. Seed Audit Logs
            audit_log_seeder = AuditLogSeeder(db)
            audit_log_seeder.seed_audit_logs(admin_id, student_ids, instructor_ids)

            Colors.success("LMS + SMS DATA SEEDED SUCCESSFULLY")

        elif args.command == "reset":
            ensure_seed_tables(db)

    finally:
        db.close()


if __name__ == "__main__":
    main()