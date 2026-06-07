"""Add question_type column and result unique constraints

Revision ID: add_qtype_and_result_uq
Revises: ba67b685a074
Create Date: 2026-06-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_qtype_and_result_uq'
down_revision = 'b5e01e28933f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add question_type column to quiz_questions
    op.add_column('quiz_questions', sa.Column('question_type', sa.String(), nullable=True, server_default='multiple_choice'))

    # Add unique constraints to results table to prevent duplicate submissions
    op.create_unique_constraint('uq_result_student_quiz', 'results', ['student_id', 'quiz_id'])
    op.create_unique_constraint('uq_result_student_assignment', 'results', ['student_id', 'assignment_id'])


def downgrade() -> None:
    op.drop_constraint('uq_result_student_assignment', 'results', type_='unique')
    op.drop_constraint('uq_result_student_quiz', 'results', type_='unique')
    op.drop_column('quiz_questions', 'question_type')
