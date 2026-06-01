"""Add hire_date to instructor_profiles table

Revision ID: add_hire_date
Revises: add_profile_attrs_001
Create Date: 2026-03-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_hire_date'
down_revision = 'add_profile_attrs_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col["name"] for col in inspector.get_columns("instructor_profiles")}

    if "hire_date" not in existing_columns:
        op.add_column("instructor_profiles", sa.Column("hire_date", sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {col["name"] for col in inspector.get_columns("instructor_profiles")}

    if "hire_date" in existing_columns:
        op.drop_column("instructor_profiles", "hire_date")
