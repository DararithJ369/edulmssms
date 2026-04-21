import argparse
from sqlalchemy import create_engine, text

from app.config.session import SQLALCHEMY_DATABASE_URL


def column_exists(conn, table_name: str, column_name: str) -> bool:
    result = conn.execute(
        text(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = :table_name AND column_name = :column_name
            """
        ),
        {"table_name": table_name, "column_name": column_name},
    ).first()
    return result is not None


def constraint_exists(conn, constraint_name: str) -> bool:
    result = conn.execute(
        text(
            """
            SELECT 1
            FROM pg_constraint
            WHERE conname = :constraint_name
            """
        ),
        {"constraint_name": constraint_name},
    ).first()
    return result is not None


def run_migration(apply: bool, keep_role_column: bool) -> None:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    with engine.begin() as conn:
        if not column_exists(conn, "users", "role") and not column_exists(conn, "users", "role_id"):
            raise RuntimeError("Neither users.role nor users.role_id exists. Cannot migrate safely.")

        if not column_exists(conn, "roles", "id") or not column_exists(conn, "roles", "name"):
            raise RuntimeError("roles table is missing required columns (id, name).")

        users_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar_one()
        print(f"Users found: {users_count}")

        if not column_exists(conn, "users", "role_id"):
            print("Adding users.role_id column...")
            conn.execute(text("ALTER TABLE users ADD COLUMN role_id INTEGER"))

        if column_exists(conn, "users", "role"):
            distinct_roles = conn.execute(
                text(
                    """
                    SELECT DISTINCT TRIM(role) AS role
                    FROM users
                    WHERE role IS NOT NULL AND TRIM(role) <> ''
                    """
                )
            ).fetchall()

            if distinct_roles:
                print("Ensuring all existing role names exist in roles table...")
                for row in distinct_roles:
                    conn.execute(
                        text(
                            """
                            INSERT INTO roles (name, description, is_active)
                            VALUES (:name, :description, TRUE)
                            ON CONFLICT (name) DO NOTHING
                            """
                        ),
                        {
                            "name": row.role,
                            "description": f"Auto-created during migration for role '{row.role}'",
                        },
                    )

            print("Backfilling users.role_id from users.role -> roles.name...")
            conn.execute(
                text(
                    """
                    UPDATE users u
                    SET role_id = r.id
                    FROM roles r
                    WHERE u.role_id IS NULL
                      AND u.role IS NOT NULL
                      AND LOWER(TRIM(u.role)) = LOWER(TRIM(r.name))
                    """
                )
            )

        null_role_id_count = conn.execute(
            text("SELECT COUNT(*) FROM users WHERE role_id IS NULL")
        ).scalar_one()

        if null_role_id_count > 0:
            raise RuntimeError(
                f"Safety stop: {null_role_id_count} user row(s) still have NULL role_id. "
                "Fix mappings in roles/users before enforcing NOT NULL."
            )

        fk_name = "users_role_id_fkey"
        if not constraint_exists(conn, fk_name):
            print("Adding foreign key users_role_id_fkey...")
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD CONSTRAINT users_role_id_fkey
                    FOREIGN KEY (role_id) REFERENCES roles(id)
                    """
                )
            )

        print("Enforcing users.role_id NOT NULL...")
        conn.execute(text("ALTER TABLE users ALTER COLUMN role_id SET NOT NULL"))

        if column_exists(conn, "users", "role") and not keep_role_column:
            print("Dropping legacy users.role column...")
            conn.execute(text("ALTER TABLE users DROP COLUMN role"))

        if not apply:
            raise RuntimeError("Dry run complete: rolling back transaction by request.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Safely migrate users.role -> users.role_id")
    parser.add_argument("--apply", action="store_true", help="Apply and commit migration changes")
    parser.add_argument(
        "--keep-role-column",
        action="store_true",
        help="Keep legacy users.role column after migration",
    )
    args = parser.parse_args()

    try:
        run_migration(apply=args.apply, keep_role_column=args.keep_role_column)
        if args.apply:
            print("Migration applied successfully.")
    except RuntimeError as exc:
        print(str(exc))
        if args.apply:
            raise
