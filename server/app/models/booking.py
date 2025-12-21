from enum import Enum

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    func,
)

from app.db import Base


class BookingStatus(str, Enum):
    CONFIRMED = "CONFIRMED"
    CANCELED = "CANCELED"


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_bookings_facility_time_status", "facility_id", "start_time", "end_time", "status"),
        Index("ix_bookings_user_time", "user_student_id", "start_time"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id", ondelete="RESTRICT"), nullable=False)
    user_student_id = Column(String(10), ForeignKey("users.student_id", ondelete="RESTRICT"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(
        SAEnum(BookingStatus, name="booking_status_enum"),
        nullable=False,
        default=BookingStatus.CONFIRMED,
        server_default=BookingStatus.CONFIRMED.value,
    )
    created_at = Column(DateTime, nullable=False, server_default=func.now())
