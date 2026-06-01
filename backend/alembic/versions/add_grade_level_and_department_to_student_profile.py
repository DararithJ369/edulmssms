"""Add grade_level_id and department to student_profile

Revision ID: add_grade_level_dept
Revises: 
Create Date: 2026-03-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_grade_level_dept'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col["name"] for col in inspector.get_columns("student_profiles")}

    if "grade_level_id" not in existing_columns:
        op.add_column("student_profiles", sa.Column("grade_level_id", sa.Integer(), nullable=True))

    if "department" not in existing_columns:
        op.add_column("student_profiles", sa.Column("department", sa.String(), nullable=True))

    existing_fks = {fk["name"] for fk in inspector.get_foreign_keys("student_profiles")}
    if "fk_student_profiles_grade_level_id" not in existing_fks:
        op.create_foreign_key(
            "fk_student_profiles_grade_level_id",
            "student_profiles",
            "grade_levels",
            ["grade_level_id"],
            ["id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col["name"] for col in inspector.get_columns("student_profiles")}
    existing_fks = {fk["name"] for fk in inspector.get_foreign_keys("student_profiles")}

    if "fk_student_profiles_grade_level_id" in existing_fks:
        op.drop_constraint("fk_student_profiles_grade_level_id", "student_profiles", type_="foreignkey")

    if "department" in existing_columns:
        op.drop_column("student_profiles", "department")

    if "grade_level_id" in existing_columns:
        op.drop_column("student_profiles", "grade_level_id")
