"""Add question_type column and result unique constraints

Revision ID: add_qtype_and_result_uq
Revises: b5e01e28933f
Create Date: 2026-06-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_qtype_and_result_uq'
down_revision = 'b5e01e28933f'
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [column["name"] for column in inspector.get_columns(table_name)]
    return column_name in columns


def _constraint_exists(table_name: str, constraint_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    # Get all unique constraints on the target table
    unique_constraints = inspector.get_unique_constraints(table_name)
    constraint_names = [uc["name"] for uc in unique_constraints if uc.get("name")]
    return constraint_name in constraint_names


def upgrade() -> None:
    # 1. Guard the column addition
    if not _column_exists('quiz_questions', 'question_type'):
        op.add_column('quiz_questions', sa.Column('question_type', sa.String(), nullable=True, server_default='multiple_choice'))

    # 2. Guard the unique constraints
    if not _constraint_exists('results', 'uq_result_student_quiz'):
        op.create_unique_constraint('uq_result_student_quiz', 'results', ['student_id', 'quiz_id'])
        
    if not _constraint_exists('results', 'uq_result_student_assignment'):
        op.create_unique_constraint('uq_result_student_assignment', 'results', ['student_id', 'assignment_id'])


def downgrade() -> None:
    try:
        op.drop_constraint('uq_result_student_assignment', 'results', type_='unique')
    except Exception:
        pass
        
    try:
        op.drop_constraint('uq_result_student_quiz', 'results', type_='unique')
    except Exception:
        pass
        
    try:
        op.drop_column('quiz_questions', 'question_type')
    except Exception:
        pass