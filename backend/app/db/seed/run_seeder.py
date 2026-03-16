import argparse
import importlib
import sys
from pathlib import Path

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
from app.utils.colors import Colors


def ensure_seed_tables(db):
    grade_module = importlib.import_module("app.models.grade")
    class_module = importlib.import_module("app.models.class_")
    profile_module = importlib.import_module("app.models.user_profile")

    grade_model = getattr(grade_module, "Grade")
    class_model = getattr(class_module, "Class")
    profile_model = getattr(profile_module, "UserProfile")

    grade_model.__table__.create(bind=db.bind, checkfirst=True)
    class_model.__table__.create(bind=db.bind, checkfirst=True)
    profile_model.__table__.create(bind=db.bind, checkfirst=True)


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

    db = local_session()

    try:
        ensure_seed_tables(db)

        if args.command == "seed":
            ensure_default_grade(db)

            role_seeder = RoleSeeder(db)
            user_seeder = UserSeeder(db)
            profile_seeder = ProfileSeeder(db)
            class_seeder = ClassSeeder(db)

            roles = role_seeder.seed_roles()

            admin_role = roles.get("admin")
            teacher_role = roles.get("teacher")
            student_role = roles.get("student")

            admin = user_seeder.seed_admin(admin_role.id)
            teacher = user_seeder.seed_teacher(teacher_role.id)

            students = user_seeder.seed_students(student_role.id, count=20)

            class1 = class_seeder.seed_class("Class A")

            if admin:
                profile_seeder.seed_profile(admin.id, "System Admin")
            if teacher:
                profile_seeder.seed_profile(teacher.id, "Mr. Sok Dara")

            for i, student in enumerate(students):
                profile_seeder.seed_profile(
                    student.id,
                    f"Student {i+1}", 
                    class1.id if class1 else None
                )

            print("LMS + SMS data seeded successfully")

        elif args.command == "reset":
            from app.db.seed.utils import clear_all_data
            clear_all_data(db)

        elif args.command == "reset-seed":
            from app.db.seed.utils import clear_all_data
            clear_all_data(db)
            main()

    finally:
        db.close()


if __name__ == "__main__":
    main()