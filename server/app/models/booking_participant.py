from sqlalchemy import Integer, Column, ForeignKey, Index, String

from app.db import Base


class BookingParticipant(Base):
    __tablename__ = "booking_participants"
    __table_args__ = (Index("ix_booking_participants_student", "student_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(20), ForeignKey("users.student_id", ondelete="CASCADE"), nullable=False)
