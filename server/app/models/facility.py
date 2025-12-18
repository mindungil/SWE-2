from enum import Enum

from sqlalchemy import Boolean, Column, Enum as SAEnum, Integer, UniqueConstraint

from app.db import Base


class FacilityResourceType(str, Enum):
    MEETING_ROOM = "MEETING_ROOM"
    LAPTOP_SEAT = "LAPTOP_SEAT"


class Facility(Base):
    __tablename__ = "facilities"
    __table_args__ = (UniqueConstraint("resource_type", "resource_number", name="uq_facility_type_number"),)

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    resource_type = Column(SAEnum(FacilityResourceType, name="resource_type_enum"), nullable=False)
    resource_number = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
