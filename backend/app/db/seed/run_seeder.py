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
        "app.models.lesson",
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
        name="Grade 10",
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

            admin = user_seeder.seed_admin(admin_role.id) if admin_role else None  # type: ignore
            instructor = user_seeder.seed_instructor(instructor_role.id) if instructor_role else None  # type: ignore
            students = user_seeder.seed_students(student_role.id, count=20) if student_role else []  # type: ignore

            # Extract IDs immediately before any further operations
            admin_id: str = admin.id if admin else None  # type: ignore[attr-defined]
            instructor_id: str = instructor.id if instructor else None  # type: ignore[attr-defined]
            student_ids_list: list[str] = [s.id for s in students]  # type: ignore[attr-defined]

            class1 = class_seeder.seed_class(section="A")
            class_id: int | None = class1.id if class1 else None  # type: ignore[attr-defined]

            if admin:
                profile_seeder.seed_profile(admin_id, "System Admin")
            if instructor:
                profile_seeder.seed_profile(instructor_id, "Mr. Sok Dara")

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

            # Get student profile IDs for enrollment
            from app.models.student_profile import StudentProfile
            from app.models.user_profile import UserProfile
            from datetime import datetime
            
            # Get user profiles for students and create student profiles if they don't exist
            student_user_profiles = db.query(UserProfile).filter(
                UserProfile.user_id.in_(student_ids_list)
            ).all()
            
            for up in student_user_profiles:
                existing_sp = db.query(StudentProfile).filter_by(profile_id=up.id).first()
                if not existing_sp:
                    sp = StudentProfile(
                        profile_id=up.id,
                        student_id=f"STU{up.id:05d}",
                        enrolment_date=datetime.now().date()
                    )
                    db.add(sp)
            
            db.commit()
            
            student_profiles = db.query(StudentProfile).all()
            student_profile_ids = [sp.id for sp in student_profiles]  # type: ignore[attr-defined]

            # Seed academic years
            academic_year_seeder = AcademicYearSeeder(db)
            academic_years = academic_year_seeder.seed_academic_years()
            academic_year_id = academic_years[0].id if academic_years else 1  # type: ignore[attr-defined]

            # Seed grade levels
            grade_level_seeder = GradeLevelSeeder(db)
            grade_levels = grade_level_seeder.seed_grade_levels()

            # Seed subjects
            subject_seeder = SubjectSeeder(db)
            subjects = subject_seeder.seed_subjects(instructor_id)

            # Extract subject IDs immediately
            subject_ids = [s.id for s in subjects] if subjects else []  # type: ignore[attr-defined]

            # Seed courses
            course_seeder = CourseSeeder(db)
            subject_id = subject_ids[0] if subject_ids else None
            courses = course_seeder.seed_courses(instructor_id, subject_id)

            # Extract course IDs immediately
            course_ids = [c.id for c in courses] if courses else []  # type: ignore[attr-defined]

            # Seed modules
            module_seeder = ModuleSeeder(db)
            course_id = course_ids[0] if course_ids else None
            modules = module_seeder.seed_modules(course_id)

            # Extract module IDs immediately
            module_ids = [m.id for m in modules] if modules else []  # type: ignore[attr-defined]

            # Seed lessons
            lesson_seeder = LessonSeeder(db)
            module_id = module_ids[0] if module_ids else None
            lessons = lesson_seeder.seed_lessons(module_id)

            # Extract lesson IDs immediately
            lesson_ids = [l.id for l in lessons] if lessons else []  # type: ignore[attr-defined]

            # Seed assignments
            assignment_seeder = AssignmentSeeder(db)
            assignments = assignment_seeder.seed_assignments(course_id, instructor_id)

            # Extract assignment IDs immediately
            assignment_ids = [a.id for a in assignments] if assignments else []  # type: ignore[attr-defined]

            # Seed enrollments
            if course_ids and student_profile_ids:
                enrollment_seeder = EnrollmentSeeder(db)
                enrollments = enrollment_seeder.seed_enrollments(course_ids[0], student_profile_ids, academic_year_id)

            # Seed attendance
            if course_ids and student_ids_list and instructor_id:
                attendance_seeder = AttendanceSeeder(db)
                attendance = attendance_seeder.seed_attendance(course_ids[0], student_ids_list, instructor_id)

            # Seed quizzes
            if course_ids and instructor_id:
                quiz_seeder = QuizSeeder(db)
                quizzes = quiz_seeder.seed_quizzes(course_ids[0], instructor_id)

            # Seed exams (with seeded lessons)
            try:
                if instructor_id and lesson_ids:
                    exam_seeder = ExamSeeder(db)
                    exams = exam_seeder.seed_exams(lesson_ids[0], instructor_id)
            except Exception as e:
                db.rollback()  # Rollback the failed transaction
                Colors.warning(f"Could not seed exams: {str(e)}")

            # Seed results
            if assignment_ids and student_ids_list:
                result_seeder = ResultSeeder(db)
                results = result_seeder.seed_results(student_ids_list, assignment_ids[0], instructor_id)

            # Seed submissions
            if assignment_ids and student_ids_list:
                submission_seeder = SubmissionSeeder(db)
                submissions = submission_seeder.seed_submissions(student_ids_list, assignment_ids[0])

            print("LMS + SMS data seeded successfully")

        elif args.command == "reset":
            ensure_seed_tables(db)

    finally:
        db.close()


if __name__ == "__main__":
    main()