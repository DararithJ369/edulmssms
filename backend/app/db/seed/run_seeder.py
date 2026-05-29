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
from app.utils.colors import Colors


def ensure_seed_tables(db):
    # Import all models to register them
    import importlib
    from app.db.base import Base
    
    # Import all model modules to ensure they're registered
    model_modules = [
        "app.models.role",
        "app.models.user",
        "app.models.user_profile",
        "app.models.class_",
        "app.models.grade",
        "app.models.subject",
        "app.models.course",
        "app.models.lesson_material",
        "app.models.assignment",
        "app.models.enrollment",
        "app.models.attendance",
        "app.models.quiz",
        "app.models.exam",
        "app.models.result",
        "app.models.submission",
        "app.models.instructor_profile",
        "app.models.student_profile",
        "app.models.parent_profile",
        "app.models.finance",
    ]
    
    for module_name in model_modules:
        try:
            importlib.import_module(module_name)
        except ImportError:
            pass
    
    # Drop all tables and recreate them
    try:
        # Use raw SQL with CASCADE to drop all tables
        db.connection().connection.set_isolation_level(0)  # autocommit mode
        db.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        db.execute(text("CREATE SCHEMA public"))
        db.connection().connection.set_isolation_level(1)  # back to normal
        Colors.success("Database schema recreated")
    except Exception as e:
        Colors.warning(f"Could not reset schema: {e}")
    
    db.commit()
    Base.metadata.create_all(bind=db.bind)


def ensure_default_grade(db):
    grade_module = importlib.import_module("app.models.grade")
    grade_model = getattr(grade_module, "Grade")

    grade = db.query(grade_model).filter_by(name="Grade 10", level=10).first()
    if grade:
        return grade

    grade = grade_model(
        name="10",
        level=10,
        description="Default grade created by seeder"
    )
    db.add(grade)
    db.commit()
    db.refresh(grade)
    Colors.success("Default grade created")
    return grade


def main():
    parser = argparse.ArgumentParser(description="LMS + SMS Seeder CLI")

    parser.add_argument(
        "command",
        choices=["seed", "reset", "reset-seed"],
        help="Seeder command"
    )

    args = parser.parse_args()

    # Handle reset-seed by resetting first, then proceeding with seed
    if args.command == "reset-seed":
        db_temp = local_session()
        try:
            ensure_seed_tables(db_temp)
            args.command = "seed"  # Convert to seed command
        finally:
            db_temp.close()

    db = local_session()

    try:
        if args.command == "seed":
            ensure_default_grade(db)

            role_seeder = RoleSeeder(db)
            user_seeder = UserSeeder(db)
            profile_seeder = ProfileSeeder(db)
            class_seeder = ClassSeeder(db)

            roles = role_seeder.seed_roles()

            admin_role = roles.get("admin")
            instructor_role = roles.get("instructor")
            student_role = roles.get("student")

            admin = user_seeder.seed_admin(admin_role.id) if admin_role else None
            # Seed 5 realistic instructors
            instructors = user_seeder.seed_instructors(instructor_role.id, count=5) if instructor_role else []
            # Make sure we also have a fallback instructor just in case
            instructor = user_seeder.seed_instructor(instructor_role.id) if instructor_role else None
            if instructor and instructor not in instructors:
                instructors.append(instructor)

            students = user_seeder.seed_students(student_role.id, count=20) if student_role else []
            parent_role = roles.get("parent")
            parents = user_seeder.seed_parents(parent_role.id, count=5) if parent_role else []  

            # Extract IDs immediately before any further operations
            admin_id: str = admin.id if admin else None  
            instructor_ids_list: list[str] = [i.id for i in instructors]
            instructor_id: str = instructor_ids_list[0] if instructor_ids_list else None
            student_ids_list: list[str] = [s.id for s in students]
            parent_ids_list: list[str] = [p.id for p in parents]  

            class1 = class_seeder.seed_class(section="A")
            class_id: int | None = class1.id if class1 else None

            if admin:
                profile_seeder.seed_profile(admin_id, "System Admin")
            
            # Seed instructor profiles
            instructor_names = [
                "Dr. Sarah Chen", "Prof. Michael Johnson", "Dr. James Wilson", 
                "Prof. Lisa Anderson", "Dr. Robert Martinez"
            ]
            for i, inst_id in enumerate(instructor_ids_list):
                inst_name = instructor_names[i] if i < len(instructor_names) else f"Instructor {i+1}"
                profile_seeder.seed_profile(inst_id, inst_name)

            # Real student names
            student_names = [
                "Emma Johnson", "Liam Smith", "Olivia Williams", "Noah Brown", "Ava Jones",
                "Ethan Garcia", "Sophia Miller", "Mason Davis", "Isabella Rodriguez", "Logan Martinez",
                "Mia Hernandez", "Lucas Lopez", "Charlotte Gonzalez", "Oliver Wilson", "Amelia Anderson",
                "Benjamin Taylor", "Harper Thomas", "Elijah Moore", "Evelyn Jackson", "James White"
            ]

            for i, student_id in enumerate(student_ids_list):
                student_name = student_names[i] if i < len(student_names) else f"Student {i+1}"
                profile_seeder.seed_profile(
                    student_id,
                    student_name, 
                    class_id
                )

            # Seed parent profiles
            parent_names = [
                "John Johnson", "Mary Smith", "David Williams", 
                "Jennifer Brown", "Robert Jones"
            ]

            for i, parent_id in enumerate(parent_ids_list):
                parent_name = parent_names[i] if i < len(parent_names) else f"Parent {i+1}"
                profile_seeder.seed_profile(parent_id, parent_name)
            
            db.commit()

            # Seed academic years FIRST (needed for enrollments)
            academic_year_seeder = AcademicYearSeeder(db)
            academic_years = academic_year_seeder.seed_academic_years()
            academic_year_id = academic_years[0].id if academic_years else 1

            # Seed grade levels BEFORE creating student profiles
            grade_level_seeder = GradeLevelSeeder(db)
            grade_levels = grade_level_seeder.seed_grade_levels()

            # Get student profile IDs for enrollment
            from app.models.student_profile import StudentProfile
            from app.models.user_profile import UserProfile
            from app.models.parent_profile import ParentProfile
            from datetime import datetime
            
            # Get user profiles for students and create student profiles if they don't exist
            student_user_profiles = db.query(UserProfile).filter(
                UserProfile.user_id.in_(student_ids_list)
            ).all()
            
            departments = ["Computer Science", "Engineering", "Business", "Science", "Arts"]
            
            # Get grade levels (Year 1-4)
            from app.models.grade_level import GradeLevel
            grade_levels_query = db.query(GradeLevel).filter(GradeLevel.name.in_(["Year 1", "Year 2", "Year 3", "Year 4"])).all()
            grade_levels = grade_levels_query
            
            for idx, up in enumerate(student_user_profiles, start=1):
                existing_sp = db.query(StudentProfile).filter_by(profile_id=up.id).first()
                if not existing_sp:
                    # Distribute students across departments and year levels
                    department = departments[(idx - 1) % len(departments)]
                    grade_level = grade_levels[(idx - 1) % len(grade_levels)] if grade_levels else None
                    
                    sp = StudentProfile(
                        profile_id=up.id,
                        student_id=f"e2026{idx:04d}",
                        department=department,
                        grade_level_id=grade_level.id if grade_level else None,
                        enrolment_date=datetime.now().date()
                    )
                    db.add(sp)
            
            db.commit()
            
            # Get parent user profiles and create parent profiles if they don't exist
            parent_user_profiles = db.query(UserProfile).filter(
                UserProfile.user_id.in_(parent_ids_list)
            ).all()
            
            parent_occupations = [
                "Software Engineer", "Teacher", "Doctor", "Business Manager", "Accountant"
            ]
            parent_relationships = ["Father", "Mother", "Guardian", "Father", "Mother"]
            
            for idx, up in enumerate(parent_user_profiles):
                existing_pp = db.query(ParentProfile).filter_by(profile_id=up.id).first()
                if not existing_pp:
                    pp = ParentProfile(
                        profile_id=up.id,
                        occupation=parent_occupations[idx] if idx < len(parent_occupations) else "Professional",
                        parent_relationship=parent_relationships[idx] if idx < len(parent_relationships) else "Parent",
                        emergency_phone="0123456789"
                    )
                    db.add(pp)
            
            db.commit()
            
            # Link parents to students (each parent gets linked to 2-3 students)
            student_profiles = db.query(StudentProfile).all()
            parent_profiles = db.query(ParentProfile).all()
            
            if student_profiles and parent_profiles:
                students_per_parent = len(student_profiles) // len(parent_profiles)
                for idx, parent_profile in enumerate(parent_profiles):
                    # Calculate which students this parent should have
                    start_idx = idx * students_per_parent
                    end_idx = start_idx + students_per_parent
                    if idx == len(parent_profiles) - 1:  # Last parent gets remaining students
                        end_idx = len(student_profiles)
                    
                    for student_profile in student_profiles[start_idx:end_idx]:
                        if student_profile not in parent_profile.students:
                            parent_profile.students.append(student_profile)
            
            db.commit()
            
            student_profiles = db.query(StudentProfile).all()
            student_profile_ids = [sp.id for sp in student_profiles]

            # Seed subjects
            subject_seeder = SubjectSeeder(db)
            subjects = subject_seeder.seed_subjects(instructor_ids_list)

            # Seed courses
            course_seeder = CourseSeeder(db)
            courses = course_seeder.seed_courses(instructor_ids_list, subjects)
            course_ids = [c.id for c in courses] if courses else []

            # Seed modules
            module_seeder = ModuleSeeder(db)
            modules = module_seeder.seed_modules(courses)

            # Seed lessons
            lesson_seeder = LessonSeeder(db)
            lessons = lesson_seeder.seed_lessons(modules)

            # Seed enrollments for ALL courses
            if course_ids and student_profile_ids:
                enrollment_seeder = EnrollmentSeeder(db)
                for c_id in course_ids:
                    enrollment_seeder.seed_enrollments(c_id, student_profile_ids, academic_year_id)

            # Seed assignments
            assignment_seeder = AssignmentSeeder(db)
            assignments = assignment_seeder.seed_assignments(courses, instructor_ids_list)

            # Seed quizzes
            quiz_seeder = QuizSeeder(db)
            quizzes = quiz_seeder.seed_quizzes(courses, instructor_ids_list)

            # Seed exams
            exam_seeder = ExamSeeder(db)
            exams = exam_seeder.seed_exams(lessons, instructor_ids_list)

            # Seed attendance across multiple dates
            attendance_seeder = AttendanceSeeder(db)
            attendance = attendance_seeder.seed_attendance(courses, student_ids_list, instructor_ids_list)

            # Seed submissions
            submission_seeder = SubmissionSeeder(db)
            submissions = submission_seeder.seed_submissions(student_ids_list, assignments)

            # Seed results with personalized feedback
            result_seeder = ResultSeeder(db)
            results = result_seeder.seed_results(student_ids_list, assignments, instructor_ids_list)

            # Seed announcements (general and course-specific)
            announcement_seeder = AnnouncementSeeder(db)
            announcements = announcement_seeder.seed_announcements(courses, instructor_ids_list, admin_id)

            # Seed finance records (fee collections, staff salaries, operating expenses)
            finance_seeder = FinanceSeeder(db)
            finance_seeder.seed_finance()

            print("LMS + SMS data seeded successfully")

        elif args.command == "reset":
            ensure_seed_tables(db)

    finally:
        db.close()


if __name__ == "__main__":
    main()