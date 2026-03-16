from sqlalchemy.orm import Session
from sqlalchemy import text


def clear_all_data(db: Session):
    """
    Clear all database tables and reset IDs.
    Adjust table names to match your LMS system.
    """

    print("🗑 Clearing database...")

    try:
        db.execute(
            text(
                """
                TRUNCATE TABLE
                user_profiles,
                users,
                classes,
                roles
                RESTART IDENTITY CASCADE
                """
            )
        )

        db.commit()

        print("Database cleared successfully")

    except Exception as e:
        db.rollback()
        print(f"Error clearing database: {e}")