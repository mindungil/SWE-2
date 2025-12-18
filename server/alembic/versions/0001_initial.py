"""initial schema"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    facility_resource_type_enum = sa.Enum(
        "MEETING_ROOM",
        "LAPTOP_SEAT",
        name="resource_type_enum",
    )
    booking_status_enum = sa.Enum(
        "CONFIRMED",
        "CANCELED",
        name="booking_status_enum",
    )

    op.create_table(
        "users",
        sa.Column("student_id", sa.String(length=10), nullable=False),
        sa.Column("birth", sa.String(length=10), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("daily_limit_meeting", sa.Integer(), server_default="0", nullable=False),
        sa.Column("weekly_limit_meeting", sa.Integer(), server_default="0", nullable=False),
        sa.Column("daily_limit_laptop", sa.Integer(), server_default="0", nullable=False),
        sa.Column("fail_to_login", sa.Integer(), server_default="0", nullable=False),
        sa.Column("unlock_time", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("revised_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("student_id"),
    )

    op.create_table(
        "facilities",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("resource_type", facility_resource_type_enum, nullable=False),
        sa.Column("resource_number", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="1", nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("resource_type", "resource_number", name="uq_facility_type_number"),
    )

    op.create_table(
        "items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_items_id"), "items", ["id"], unique=False)
    op.create_index(op.f("ix_items_name"), "items", ["name"], unique=False)

    op.create_table(
        "bookings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("facility_id", sa.Integer(), nullable=False),
        sa.Column("user_student_id", sa.String(length=10), nullable=False),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=False),
        sa.Column("status", booking_status_enum, server_default="CONFIRMED", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["facility_id"], ["facilities.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["user_student_id"], ["users.student_id"], ondelete="RESTRICT"),
    )
    op.create_index(
        "ix_bookings_facility_time_status",
        "bookings",
        ["facility_id", "start_time", "end_time", "status"],
        unique=False,
    )
    op.create_index("ix_bookings_user_time", "bookings", ["user_student_id", "start_time"], unique=False)

    op.create_table(
        "booking_participants",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("booking_id", sa.BigInteger(), nullable=False),
        sa.Column("student_id", sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["users.student_id"], ondelete="CASCADE"),
    )
    op.create_index("ix_booking_participants_student", "booking_participants", ["student_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_booking_participants_student", table_name="booking_participants")
    op.drop_table("booking_participants")

    op.drop_index("ix_bookings_user_time", table_name="bookings")
    op.drop_index("ix_bookings_facility_time_status", table_name="bookings")
    op.drop_table("bookings")

    op.drop_index(op.f("ix_items_name"), table_name="items")
    op.drop_index(op.f("ix_items_id"), table_name="items")
    op.drop_table("items")

    op.drop_table("facilities")
    op.drop_table("users")

    bind = op.get_bind()
    if bind.dialect.name != "sqlite":
        op.execute(sa.text("DROP TYPE IF EXISTS resource_type_enum"))
        op.execute(sa.text("DROP TYPE IF EXISTS booking_status_enum"))
