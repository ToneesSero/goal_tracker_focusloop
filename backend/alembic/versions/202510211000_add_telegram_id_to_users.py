"""Add telegram_id to users

Revision ID: 202510211000
Revises: 202502181203
Create Date: 2025-10-21 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "202510211000"
down_revision = "202502181203"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make email nullable
    op.alter_column('users', 'email', nullable=True)

    # Make hashed_password nullable
    op.alter_column('users', 'hashed_password', nullable=True)

    # Add telegram_id column
    op.add_column('users', sa.Column('telegram_id', sa.BigInteger(), nullable=True))
    op.create_index('ix_users_telegram_id', 'users', ['telegram_id'], unique=True)


def downgrade() -> None:
    # Remove telegram_id
    op.drop_index('ix_users_telegram_id', table_name='users')
    op.drop_column('users', 'telegram_id')

    # Make hashed_password not nullable
    op.alter_column('users', 'hashed_password', nullable=False)

    # Make email not nullable
    op.alter_column('users', 'email', nullable=False)