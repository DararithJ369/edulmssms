import argparse
from sqlalchemy import create_engine, text

from app.config.session import SQLALCHEMY_DATABASE_URL


DEFAULT_PERMISSIONS = [
    {"key": "grades.view", "description": "View student grades"},
    {"key": "grades.edit", "description": "Create or update grades"},
    {"key": "attendance.view", "description": "View student attendance"},
    {"key": "attendance.edit", "description": "Record or update attendance"},
    {"key": "courses.view", "description": "View courses"},
    {"key": "courses.manage", "description": "Create or manage courses"},
    {"key": "enrollments.manage", "description": "Manage course enrollments"},
    {"key": "assignments.manage", "description": "Create and manage assignments"},
    {"key": "submissions.grade", "description": "Grade submissions"},
    {"key": "quizzes.manage", "description": "Create and manage quizzes"},
    {"key": "results.view", "description": "View assessment results"},
    {"key": "users.manage", "description": "Manage users"},
    {"key": "roles.manage", "description": "Manage roles"},
    {"key": "permissions.manage", "description": "Manage permissions"},
    {"key": "finance.view", "description": "View finance data"},
    {"key": "finance.manage", "description": "Manage finance records"},
]


def seed_permissions(apply: bool) -> None:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    with engine.begin() as conn:
        for permission in DEFAULT_PERMISSIONS:
            conn.execute(
                text(
                    """
                    INSERT INTO permissions (key, description, is_active)
                    VALUES (:key, :description, TRUE)
                    ON CONFLICT (key)
                    DO UPDATE SET description = EXCLUDED.description, is_active = TRUE
                    """
                ),
                permission,
            )

        if not apply:
            raise RuntimeError("Dry run complete: rolling back transaction by request.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed default permissions")
    parser.add_argument("--apply", action="store_true", help="Apply and commit seed data")
    args = parser.parse_args()

    try:
        seed_permissions(apply=args.apply)
        if args.apply:
            print("Permissions seeded successfully.")
    except RuntimeError as exc:
        print(str(exc))
        if args.apply:
            raise
