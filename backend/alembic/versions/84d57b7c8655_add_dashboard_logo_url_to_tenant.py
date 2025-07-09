"""add_dashboard_logo_url_to_tenant

Revision ID: 84d57b7c8655
Revises: 752ea66190a1
Create Date: 2025-07-09 15:57:21.186824

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '84d57b7c8655'
down_revision: Union[str, None] = '752ea66190a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add dashboard_logo_url column to tenants table
    op.add_column('tenants', sa.Column('dashboard_logo_url', sa.String(500), nullable=True))


def downgrade() -> None:
    # Remove dashboard_logo_url column from tenants table
    op.drop_column('tenants', 'dashboard_logo_url')
