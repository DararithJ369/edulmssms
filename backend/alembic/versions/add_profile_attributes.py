"""Add additional profile attributes to user_profiles table

Revision ID: add_profile_attrs_001
Revises: add_grade_level_dept
Create Date: 2026-03-20 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_profile_attrs_001'
down_revision = 'add_grade_level_dept'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to user_profiles table
    op.add_column('user_profiles', sa.Column('date_of_birth', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('gender', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('national_id', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('website', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('linkedin', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('emergency_contact_name', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('emergency_contact_phone', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove the columns if downgrading
    op.drop_column('user_profiles', 'emergency_contact_phone')
    op.drop_column('user_profiles', 'emergency_contact_name')
    op.drop_column('user_profiles', 'linkedin')
    op.drop_column('user_profiles', 'website')
    op.drop_column('user_profiles', 'national_id')
    op.drop_column('user_profiles', 'gender')
    op.drop_column('user_profiles', 'date_of_birth')
