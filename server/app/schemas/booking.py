from datetime import date, datetime, time
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class BookingCompanion(BaseModel):
    student_id: str = Field(..., examples=["202312346"])
    name: str = Field(..., examples=["이순신"])


class MeetingRoomBookingCreate(BaseModel):
    room_number: int
    date: date
    start_time: time
    end_time: time
    companions: List[BookingCompanion] = Field(default_factory=list)


class BookingParticipantInfo(BaseModel):
    student_id: str
    name: str


class MeetingRoomBookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: int
    facility_id: int
    room_number: int
    start_time: datetime
    end_time: datetime
    participants: List[BookingParticipantInfo]


class LaptopSeatBookingCreate(BaseModel):
    seat_number: int
    date: date
    start_time: time
    end_time: time


class LaptopSeatBookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: int
    facility_id: int
    seat_number: int
    start_time: datetime
    end_time: datetime


class LaptopSeatRandomBookingCreate(BaseModel):
    date: date
    start_time: time
    end_time: time
