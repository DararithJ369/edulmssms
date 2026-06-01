"""merge heads

Revision ID: ba67b685a074
Revises: add_finance_permissions, add_payment_and_published_fields
Create Date: 2026-06-01 22:18:24.423607

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ba67b685a074'
down_revision = ('add_finance_permissions', 'add_payment_and_published_fields')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
