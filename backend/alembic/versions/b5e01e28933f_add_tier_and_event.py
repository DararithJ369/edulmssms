"""add_tier_and_event

Revision ID: b5e01e28933f
Revises: ba67b685a074
Create Date: 2026-06-06 23:12:48.879140

""" 
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'b5e01e28933f'
down_revision = 'ba67b685a074'
branch_labels = None
depends_on = None


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = inspect(bind)
    columns = [column["name"] for column in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. Guard table creation
    if 'events' not in existing_tables:
        op.create_table('events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_events_id'), 'events', ['id'], unique=False)

    # 2. Guard column addition
    if not _column_exists("user_profiles", "tier"):
        op.add_column('user_profiles', sa.Column('tier', sa.String(), server_default='free', nullable=False))


def downgrade() -> None:
    try:
        op.drop_column('user_profiles', 'tier')
    except Exception:
        pass
        
    try:
        op.drop_index(op.f('ix_events_id'), table_name='events')
        op.drop_table('events')
    except Exception:
        pass