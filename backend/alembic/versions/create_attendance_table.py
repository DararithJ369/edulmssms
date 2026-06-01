"""create attendance table

Revision ID: create_attendance_001
Revises: add_missing_fields
Create Date: 2026-04-03 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = 'create_attendance_001'
down_revision = 'add_missing_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "attendance" not in inspector.get_table_names():
        op.create_table(
            "attendance",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("student_id", sa.String(), nullable=False),
            sa.Column("course_id", sa.Integer(), nullable=False),
            sa.Column("date", sa.Date(), nullable=False),
            sa.Column("status", sa.String(), nullable=False),
            sa.Column("time", sa.String(), nullable=True),
            sa.Column("note", sa.String(), nullable=True),
            sa.Column("recorded_by", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
            sa.ForeignKeyConstraint(["recorded_by"], ["users.id"]),
            sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_attendance_id"), "attendance", ["id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    if "attendance" in inspector.get_table_names():
        op.drop_index(op.f("ix_attendance_id"), table_name="attendance")
        op.drop_table("attendance")
