"""Add payment fields to enrollments and is_published to courses

Revision ID: add_payment_and_published_fields
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'add_payment_and_published_fields'
down_revision = '88db4dab6490'
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [column["name"] for column in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    # Add payment fields to enrollments table
    if not _column_exists("enrollments", "payment_status"):
        op.add_column(
            "enrollments",
            sa.Column("payment_status", sa.String(), nullable=True, server_default="pending"),
        )
    if not _column_exists("enrollments", "payment_id"):
        op.add_column("enrollments", sa.Column("payment_id", sa.String(), nullable=True))
    if not _column_exists("enrollments", "amount_paid"):
        op.add_column(
            "enrollments",
            sa.Column("amount_paid", sa.Float(), nullable=True, server_default="0"),
        )

    # Add is_published to courses table
    if not _column_exists("courses", "is_published"):
        op.add_column(
            "courses",
            sa.Column("is_published", sa.Boolean(), nullable=False, server_default="false"),
        )

    # Update Module and Lesson relationships
    if not _column_exists("modules", "course_id"):
        op.add_column(
            "modules",
            sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        )
    if not _column_exists("lessons", "content"):
        op.add_column("lessons", sa.Column("content", sa.Text(), nullable=True))
    if not _column_exists("lessons", "duration"):
        op.add_column(
            "lessons",
            sa.Column("duration", sa.String(), nullable=True, server_default="0min"),
        )


def downgrade() -> None:
    # Remove payment fields from enrollments
    op.drop_column('enrollments', 'amount_paid')
    op.drop_column('enrollments', 'payment_id')
    op.drop_column('enrollments', 'payment_status')
    
    # Remove is_published from courses
    op.drop_column('courses', 'is_published')
    
    # Remove added columns
    op.drop_column('lessons', 'duration')
    op.drop_column('lessons', 'content')
    op.drop_column('modules', 'course_id')
