"""Add hire_date to instructor_profiles table

Revision ID: add_hire_date
Revises: add_profile_attrs_001
Create Date: 2026-03-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_hire_date'
down_revision = 'add_profile_attrs_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add hire_date column to instructor_profiles table
    op.add_column('instructor_profiles', sa.Column('hire_date', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove hire_date column from instructor_profiles table
    op.drop_column('instructor_profiles', 'hire_date')
