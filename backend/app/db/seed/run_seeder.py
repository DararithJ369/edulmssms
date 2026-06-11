import argparse
import importlib
import sys
from pathlib import Path
from sqlalchemy import text

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
    
    # CRITICAL: Let Alembic build the schema incrementally so history stays intact!
    try:
        Colors.info("Running migrations programmatically...")
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        Colors.success("Database schema successfully generated via Alembic")
    except Exception as e:
        Colors.error(f"Alembic automated initialization failed: {e}")


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
            role_seeder = RoleSeeder(db)
            grade_level_seeder = GradeLevelSeeder(db)
            user_seeder = UserSeeder(db)
            profile_seeder = ProfileSeeder(db)
            class_seeder = ClassSeeder(db)

            roles = role_seeder.seed_roles()
            grade_levels = grade_level_seeder.seed_grade_levels()

            admin_role = roles.get("admin")
            instructor_role = roles.get("instructor")
            student_role = roles.get("student")

            admin = user_seeder.seed_admin(admin_role.id) if admin_role else None
            instructors = user_seeder.seed_instructors(instructor_role.id, count=5) if instructor_role else []
            instructor = user_seeder.seed_instructor(instructor_role.id) if instructor_role else None
            if instructor and instructor not in instructors:
                instructors.append(instructor)

            username_order = ["instructor", "michael.johnson", "james.wilson", "lisa.anderson", "robert.martinez", "sarah.chen"]
            instructors_dict = {inst.username: inst for inst in instructors}
            ordered_instructors = []
            for username in username_order:
                if username in instructors_dict:
                    ordered_instructors.append(instructors_dict[username])
            for inst in instructors:
                if inst not in ordered_instructors:
                    ordered_instructors.append(inst)
            instructors = ordered_instructors

            students = user_seeder.seed_students(student_role.id, count=20) if student_role else []
            parent_role = roles.get("parent")
            parents = user_seeder.seed_parents(parent_role.id, count=5) if parent_role else []  

            admin_id = admin.id if admin else None  
            instructor_ids_list = [i.id for i in instructors]
            student_ids_list = [s.id for s in students]
            parent_ids_list = [p.id for p in parents]  

            class1 = class_seeder.seed_class(section="A")
            class_id = class1.id if class1 else None

            if admin:
                profile_seeder.seed_profile(admin_id, "System Admin")
            
            username_to_name = {
                "instructor": "Dr. Sarah Chen", "sarah.chen": "Dr. Sarah Chen",
                "michael.johnson": "Prof. Michael Johnson", "james.wilson": "Dr. James Wilson",
                "lisa.anderson": "Prof. Lisa Anderson", "robert.martinez": "Dr. Robert Martinez"
            }
            for inst in instructors:
                inst_name = username_to_name.get(inst.username, f"Instructor {inst.username}")
                profile_seeder.seed_profile(inst.id, inst_name)

            student_names = [
                "Emma Johnson", "Liam Smith", "Olivia Williams", "Noah Brown", "Ava Jones",
                "Ethan Garcia", "Sophia Miller", "Mason Davis", "Isabella Rodriguez", "Logan Martinez",
                "Mia Hernandez", "Lucas Lopez", "Charlotte Gonzalez", "Oliver Wilson", "Amelia Anderson",
                "Benjamin Taylor", "Harper Thomas", "Elijah Moore", "Evelyn Jackson", "James White"
            ]

            for i, student_id in enumerate(student_ids_list):
                student_name = student_names[i] if i < len(student_names) else f"Student {i+1}"
                profile_seeder.seed_profile(student_id, student_name, class_id)

            parent_names = ["John Johnson", "Mary Smith", "David Williams", "Jennifer Brown", "Robert Jones"]
            for i, parent_id in enumerate(parent_ids_list):
                parent_name = parent_names[i] if i < len(parent_names) else f"Parent {i+1}"
                profile_seeder.seed_profile(parent_id, parent_name)
            
            db.commit()

            academic_year_seeder = AcademicYearSeeder(db)
            academic_years = academic_year_seeder.seed_academic_years()
            academic_year_id = academic_years[0].id if academic_years else 1

            from app.models.student_profile import StudentProfile
            from app.models.user_profile import UserProfile
            from app.models.parent_profile import ParentProfile
            from datetime import datetime
            
            student_user_profiles = db.query(UserProfile).filter(UserProfile.user_id.in_(student_ids_list)).all()
            departments = ["Computer Science", "Engineering", "Business", "Science", "Arts"]
            
            from app.models.grade_level import GradeLevel
            grade_levels = db.query(GradeLevel).filter(GradeLevel.name.in_(["Year 1", "Year 2", "Year 3", "Year 4"])).all()
            
            for idx, up in enumerate(student_user_profiles, start=1):
                existing_sp = db.query(StudentProfile).filter_by(profile_id=up.id).first()
                if not existing_sp:
                    department = departments[(idx - 1) % len(departments)]
                    grade_level = grade_levels[(idx - 1) % len(grade_levels)] if grade_levels else None
                    sp = StudentProfile(
                        profile_id=up.id, student_id=f"e2026{idx:04d}", department=department,
                        grade_level_id=grade_level.id if grade_level else None, enrolment_date=datetime.now().date()
                    )
                    db.add(sp)
            db.commit()
            
            parent_user_profiles = db.query(UserProfile).filter(UserProfile.user_id.in_(parent_ids_list)).all()
            parent_occupations = ["Software Engineer", "Teacher", "Doctor", "Business Manager", "Accountant"]
            parent_relationships = ["Father", "Mother", "Guardian", "Father", "Mother"]
            
            for idx, up in enumerate(parent_user_profiles):
                existing_pp = db.query(ParentProfile).filter_by(profile_id=up.id).first()
                if not existing_pp:
                    pp = ParentProfile(
                        profile_id=up.id, emergency_phone="0123456789",
                        occupation=parent_occupations[idx] if idx < len(parent_occupations) else "Professional",
                        parent_relationship=parent_relationships[idx] if idx < len(parent_relationships) else "Parent"
                    )
                    db.add(pp)
            db.commit()
            
            from app.models.user import User
            from app.models.instructor_profile import InstructorProfile
            instructor_user_profiles = db.query(UserProfile).filter(UserProfile.user_id.in_(instructor_ids_list)).all()
            
            instructor_departments = {
                "instructor": "Computer Science", "sarah.chen": "Computer Science", "michael.johnson": "Data Science",
                "james.wilson": "Artificial Intelligence", "lisa.anderson": "Software Engineering", "robert.martinez": "Information Technology"
            }
            instructor_positions = {
                "instructor": "Associate Professor", "sarah.chen": "Associate Professor", "michael.johnson": "Senior Lecturer",
                "james.wilson": "Professor", "lisa.anderson": "Lecturer", "robert.martinez": "Assistant Professor"
            }
            
            for up in instructor_user_profiles:
                user_obj = db.query(User).filter_by(id=up.user_id).first()
                username = user_obj.username if user_obj else ""
                existing_ip = db.query(InstructorProfile).filter_by(profile_id=up.id).first()
                if not existing_ip:
                    dept = instructor_departments.get(username, "Computer Science")
                    pos = instructor_positions.get(username, "Lecturer")
                    office_num = 100 + sum(ord(c) for c in username) % 200
                    
                    ip = InstructorProfile(
                        profile_id=up.id, department=dept, position=pos, office=f"Office {office_num}",
                        hire_date=datetime.now().date()
                    )
                    db.add(ip)
            db.commit()
            
            student_profiles = db.query(StudentProfile).all()
            parent_profiles = db.query(ParentProfile).all()
            
            if student_profiles and parent_profiles:
                students_per_parent = len(student_profiles) // len(parent_profiles)
                for idx, parent_profile in enumerate(parent_profiles):
                    start_idx = idx * students_per_parent
                    end_idx = start_idx + students_per_parent
                    if idx == len(parent_profiles) - 1:
                        end_idx = len(student_profiles)
                    
                    for student_profile in student_profiles[start_idx:end_idx]:
                        if student_profile not in parent_profile.students:
                            parent_profile.students.append(student_profile)
            db.commit()
            
            student_profiles = db.query(StudentProfile).all()
            student_profile_ids = [sp.id for sp in student_profiles]

            subject_seeder = SubjectSeeder(db)
            subjects = subject_seeder.seed_subjects(instructor_ids_list)

            course_seeder = CourseSeeder(db)
            courses = course_seeder.seed_courses(instructor_ids_list, subjects)
            course_ids = [c.id for c in courses] if courses else []

            module_seeder = ModuleSeeder(db)
            modules = module_seeder.seed_modules(courses)

            lesson_seeder = LessonSeeder(db)
            lessons = lesson_seeder.seed_lessons(modules)

            if course_ids and student_profile_ids:
                enrollment_seeder = EnrollmentSeeder(db)
                for c_id in course_ids:
                    enrollment_seeder.seed_enrollments(c_id, student_profile_ids, academic_year_id)

            assignment_seeder = AssignmentSeeder(db)
            assignments = assignment_seeder.seed_assignments(courses, instructor_ids_list)

            quiz_seeder = QuizSeeder(db)
            quizzes = quiz_seeder.seed_quizzes(courses, instructor_ids_list)

            exam_seeder = ExamSeeder(db)
            exams = exam_seeder.seed_exams(lessons, instructor_ids_list)

            attendance_seeder = AttendanceSeeder(db)
            attendance = attendance_seeder.seed_attendance(courses, student_ids_list, instructor_ids_list)

            submission_seeder = SubmissionSeeder(db)
            submissions = submission_seeder.seed_submissions(student_ids_list, assignments)

            result_seeder = ResultSeeder(db)
            results = result_seeder.seed_results(student_ids_list, assignments, instructor_ids_list)

            announcement_seeder = AnnouncementSeeder(db)
            announcements = announcement_seeder.seed_announcements(courses, instructor_ids_list, admin_id)

            finance_seeder = FinanceSeeder(db)
            finance_seeder.seed_finance()

            # Calling decoupled ScheduleSlotSeeder
            schedule_slot_seeder = ScheduleSlotSeeder(db)
            schedule_slot_seeder.seed_schedule_slots(class_id, instructor_ids_list, subjects)

            audit_log_seeder = AuditLogSeeder(db)
            audit_log_seeder.seed_audit_logs(admin_id, student_ids_list, instructor_ids_list)

            # Calling decoupled EventSeeder
            event_seeder = EventSeeder(db)
            event_seeder.seed_events(class_id)

            Colors.success("LMS + SMS DATA SEEDED SUCCESSFULLY")

        elif args.command == "reset":
            ensure_seed_tables(db)

    finally:
        db.close()


if __name__ == "__main__":
    main()