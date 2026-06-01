"""Add additional profile attributes to user_profiles table

Revision ID: add_profile_attrs_001
Revises: add_grade_level_dept
Create Date: 2026-03-20 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_profile_attrs_001'
down_revision = 'add_grade_level_dept'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col["name"] for col in inspector.get_columns("user_profiles")}

    if "date_of_birth" not in existing_columns:
        op.add_column("user_profiles", sa.Column("date_of_birth", sa.String(), nullable=True))
    if "gender" not in existing_columns:
        op.add_column("user_profiles", sa.Column("gender", sa.String(), nullable=True))
    if "national_id" not in existing_columns:
        op.add_column("user_profiles", sa.Column("national_id", sa.String(), nullable=True))
    if "website" not in existing_columns:
        op.add_column("user_profiles", sa.Column("website", sa.String(), nullable=True))
    if "linkedin" not in existing_columns:
        op.add_column("user_profiles", sa.Column("linkedin", sa.String(), nullable=True))
    if "emergency_contact_name" not in existing_columns:
        op.add_column("user_profiles", sa.Column("emergency_contact_name", sa.String(), nullable=True))
    if "emergency_contact_phone" not in existing_columns:
        op.add_column("user_profiles", sa.Column("emergency_contact_phone", sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col["name"] for col in inspector.get_columns("user_profiles")}

    if "emergency_contact_phone" in existing_columns:
        op.drop_column("user_profiles", "emergency_contact_phone")
    if "emergency_contact_name" in existing_columns:
        op.drop_column("user_profiles", "emergency_contact_name")
    if "linkedin" in existing_columns:
        op.drop_column("user_profiles", "linkedin")
    if "website" in existing_columns:
        op.drop_column("user_profiles", "website")
    if "national_id" in existing_columns:
        op.drop_column("user_profiles", "national_id")
    if "gender" in existing_columns:
        op.drop_column("user_profiles", "gender")
    if "date_of_birth" in existing_columns:
        op.drop_column("user_profiles", "date_of_birth")
