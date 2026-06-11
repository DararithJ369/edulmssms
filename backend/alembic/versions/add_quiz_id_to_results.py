"""Add quiz_id to results table

Revision ID: add_quiz_id_to_results
Revises: create_attendance_001
Create Date: 2026-04-03 12:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_quiz_id_to_results'
down_revision = 'create_attendance_001'
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [column["name"] for column in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Only alter the table structural components if they don't exist yet
    if not _column_exists("results", "quiz_id"):
        op.add_column('results', sa.Column('quiz_id', sa.Integer(), nullable=True))
        op.create_foreign_key('fk_results_quizzes', 'results', 'quizzes', ['quiz_id'], ['id'])


def downgrade() -> None:
    try:
        op.drop_constraint('fk_results_quizzes', 'results', type_='foreignkey')
        op.drop_column('results', 'quiz_id')
    except Exception:
        pass