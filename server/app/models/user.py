from sqlalchemy import Column, DateTime, Integer, String, func

from app.db import Base


class User(Base):
    __tablename__ = "users"

    student_id = Column(String(10), primary_key=True, nullable=False)
    birth = Column(String(10), nullable=False)
    name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    daily_limit_meeting = Column(Integer, nullable=False, default=0, server_default="0")
    weekly_limit_meeting = Column(Integer, nullable=False, default=0, server_default="0")
    daily_limit_laptop = Column(Integer, nullable=False, default=0, server_default="0")
    fail_to_login = Column(Integer, nullable=False, default=0, server_default="0")
    unlock_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    revised_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
