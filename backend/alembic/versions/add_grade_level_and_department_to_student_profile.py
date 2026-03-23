"""Add grade_level_id and department to student_profile

Revision ID: add_grade_level_dept
Revises: 
Create Date: 2026-03-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_grade_level_dept'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add grade_level_id column
    op.add_column('student_profiles', sa.Column('grade_level_id', sa.Integer(), nullable=True))
    
    # Add department column
    op.add_column('student_profiles', sa.Column('department', sa.String(), nullable=True))
    
    # Add foreign key constraint for grade_level_id
    op.create_foreign_key(
        'fk_student_profiles_grade_level_id',
        'student_profiles', 'grade_levels',
        ['grade_level_id'], ['id']
    )


def downgrade() -> None:
    # Remove foreign key constraint
    op.drop_constraint('fk_student_profiles_grade_level_id', 'student_profiles', type_='foreignkey')
    
    # Remove columns
    op.drop_column('student_profiles', 'department')
    op.drop_column('student_profiles', 'grade_level_id')
