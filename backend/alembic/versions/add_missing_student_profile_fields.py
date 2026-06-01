"""Add missing student and user profile fields

Revision ID: add_missing_fields
Revises: add_hire_date
Create Date: 2026-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_missing_fields'
down_revision = 'add_hire_date'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    user_profile_columns = {col["name"] for col in inspector.get_columns("user_profiles")}
    student_profile_columns = {col["name"] for col in inspector.get_columns("student_profiles")}

    if "nationality" not in user_profile_columns:
        op.add_column("user_profiles", sa.Column("nationality", sa.String(), nullable=True))
    if "emergency_contact_relationship" not in user_profile_columns:
        op.add_column("user_profiles", sa.Column("emergency_contact_relationship", sa.String(), nullable=True))
    if "blood_type" not in user_profile_columns:
        op.add_column("user_profiles", sa.Column("blood_type", sa.String(), nullable=True))
    if "medical_conditions" not in user_profile_columns:
        op.add_column("user_profiles", sa.Column("medical_conditions", sa.String(), nullable=True))

    if "previous_school" not in student_profile_columns:
        op.add_column("student_profiles", sa.Column("previous_school", sa.String(), nullable=True))
    if "scholarship_status" not in student_profile_columns:
        op.add_column("student_profiles", sa.Column("scholarship_status", sa.String(), nullable=True))
    if "special_needs" not in student_profile_columns:
        op.add_column("student_profiles", sa.Column("special_needs", sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    user_profile_columns = {col["name"] for col in inspector.get_columns("user_profiles")}
    student_profile_columns = {col["name"] for col in inspector.get_columns("student_profiles")}

    if "special_needs" in student_profile_columns:
        op.drop_column("student_profiles", "special_needs")
    if "scholarship_status" in student_profile_columns:
        op.drop_column("student_profiles", "scholarship_status")
    if "previous_school" in student_profile_columns:
        op.drop_column("student_profiles", "previous_school")

    if "medical_conditions" in user_profile_columns:
        op.drop_column("user_profiles", "medical_conditions")
    if "blood_type" in user_profile_columns:
        op.drop_column("user_profiles", "blood_type")
    if "emergency_contact_relationship" in user_profile_columns:
        op.drop_column("user_profiles", "emergency_contact_relationship")
    if "nationality" in user_profile_columns:
        op.drop_column("user_profiles", "nationality")
