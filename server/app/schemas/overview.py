from datetime import date, datetime
from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class ResourceStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    BOOKED = "BOOKED"


class MeetingRoomStatus(BaseModel):
    room_number: int = Field(..., examples=[1])
    status: ResourceStatus


class LaptopSeatStatus(BaseModel):
    resource_number: int = Field(..., examples=[37])
    is_available: bool = Field(..., examples=[True])


class OverviewResponse(BaseModel):
    name: str = Field(..., examples=["홍길동"])
    date: date
    checked_at: datetime = Field(..., examples=["2025-12-20T17:17:27"])
    meeting_rooms: List[MeetingRoomStatus]
    laptop_seats: List[LaptopSeatStatus]
