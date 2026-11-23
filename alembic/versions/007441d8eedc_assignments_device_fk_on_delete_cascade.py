"""assignments device fk on delete cascade

Revision ID: 007441d8eedc
Revises: 53797564a7b2
Create Date: 2026-11-23 12:02:15.306095

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007441d8eedc'
down_revision: Union[str, Sequence[str], None] = '53797564a7b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op


def upgrade():
    op.drop_constraint("assignments_device_id_fkey", "assignments", type_="foreignkey")
    op.create_foreign_key(
        "assignments_device_id_fkey",
        "assignments", "devices",
        ["device_id"], ["id"],
        ondelete="CASCADE",
    )


def downgrade():
    op.drop_constraint("assignments_device_id_fkey", "assignments", type_="foreignkey")
    op.create_foreign_key(
        "assignments_device_id_fkey",
        "assignments", "devices",
        ["device_id"], ["id"],
    )