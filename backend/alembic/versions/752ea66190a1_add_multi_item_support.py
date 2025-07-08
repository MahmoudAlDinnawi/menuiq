"""add_multi_item_support

Revision ID: 752ea66190a1
Revises: 494eb415fa85
Create Date: 2025-07-07 16:18:47.893295

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '752ea66190a1'
down_revision: Union[str, None] = '494eb415fa85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_multi_item flag to menu_items table
    op.add_column('menu_items', 
        sa.Column('is_multi_item', sa.Boolean(), server_default='false', nullable=False)
    )
    
    # Add parent_item_id for sub-items to reference their parent multi-item
    op.add_column('menu_items',
        sa.Column('parent_item_id', sa.Integer(), nullable=True)
    )
    
    # Add foreign key constraint for parent_item_id
    op.create_foreign_key(
        'fk_menu_items_parent_item_id',
        'menu_items', 'menu_items',
        ['parent_item_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # Add index for faster queries on parent_item_id
    op.create_index(
        'ix_menu_items_parent_item_id',
        'menu_items',
        ['parent_item_id']
    )
    
    # Add price_min and price_max columns for multi-items to show price range
    op.add_column('menu_items',
        sa.Column('price_min', sa.DECIMAL(10, 2), nullable=True)
    )
    op.add_column('menu_items',
        sa.Column('price_max', sa.DECIMAL(10, 2), nullable=True)
    )
    
    # Add display_as_grid flag for multi-items display preference
    op.add_column('menu_items',
        sa.Column('display_as_grid', sa.Boolean(), server_default='true', nullable=False)
    )
    
    # Add sort order for sub-items within a multi-item
    op.add_column('menu_items',
        sa.Column('sub_item_order', sa.Integer(), server_default='0', nullable=False)
    )
    
    # Create a check constraint to ensure multi-items don't have parent_item_id
    op.create_check_constraint(
        'ck_multi_item_no_parent',
        'menu_items',
        'NOT (is_multi_item = true AND parent_item_id IS NOT NULL)'
    )
    
    # Create a check constraint to ensure sub-items are not multi-items
    op.create_check_constraint(
        'ck_sub_item_not_multi',
        'menu_items',
        'NOT (parent_item_id IS NOT NULL AND is_multi_item = true)'
    )


def downgrade() -> None:
    # Drop check constraints
    op.drop_constraint('ck_sub_item_not_multi', 'menu_items')
    op.drop_constraint('ck_multi_item_no_parent', 'menu_items')
    
    # Drop index
    op.drop_index('ix_menu_items_parent_item_id', 'menu_items')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_menu_items_parent_item_id', 'menu_items', type_='foreignkey')
    
    # Drop columns
    op.drop_column('menu_items', 'sub_item_order')
    op.drop_column('menu_items', 'display_as_grid')
    op.drop_column('menu_items', 'price_max')
    op.drop_column('menu_items', 'price_min')
    op.drop_column('menu_items', 'parent_item_id')
    op.drop_column('menu_items', 'is_multi_item')
