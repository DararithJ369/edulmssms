"""0001_initial_base_tables

Revision ID: 88db4dab6490
Revises: None
Create Date: 2026-06-09 04:42:03.999936

"""
from alembic import op
import sqlalchemy as sa
from app.db.base import Base  # This imports all your registered application models

# revision identifiers, used by Alembic.
revision = '88db4dab6490'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get the active database connection bind from Alembic
    bind = op.get_bind()
    # Programmatically create every core table from your metadata right here!
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)