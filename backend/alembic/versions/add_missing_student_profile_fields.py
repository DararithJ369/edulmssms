"""Add missing student and user profile fields

Revision ID: add_missing_fields
Revises: add_hire_date
Create Date: 2026-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_missing_fields'
down_revision = 'add_hire_date'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing fields to user_profiles table
    op.add_column('user_profiles', sa.Column('nationality', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('emergency_contact_relationship', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('blood_type', sa.String(), nullable=True))
    op.add_column('user_profiles', sa.Column('medical_conditions', sa.String(), nullable=True))
    
    # Add missing fields to student_profiles table
    op.add_column('student_profiles', sa.Column('previous_school', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('scholarship_status', sa.String(), nullable=True))
    op.add_column('student_profiles', sa.Column('special_needs', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove fields from student_profiles table
    op.drop_column('student_profiles', 'special_needs')
    op.drop_column('student_profiles', 'scholarship_status')
    op.drop_column('student_profiles', 'previous_school')
    
    # Remove fields from user_profiles table
    op.drop_column('user_profiles', 'medical_conditions')
    op.drop_column('user_profiles', 'blood_type')
    op.drop_column('user_profiles', 'emergency_contact_relationship')
    op.drop_column('user_profiles', 'nationality')
