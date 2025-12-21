from datetime import date, datetime, time
from typing import List

from pydantic import BaseModel, ConfigDict, Field


class BookingCompanion(BaseModel):
    student_id: str = Field(..., examples=["202312346"])
    name: str = Field(..., examples=["이순신"])


class MeetingRoomBookingCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "room_number": 1,
                    "date": "2025-12-20",
                    "start_time": "17:00:00",
                    "end_time": "18:00:00",
                    "companions": [
                        {"student_id": "202312346", "name": "이순신"},
                        {"student_id": "202312347", "name": "강감찬"},
                    ],
                }
            ]
        }
    )

    room_number: int
    date: date
    start_time: time
    end_time: time
    companions: List[BookingCompanion] = Field(default_factory=list)


class BookingParticipantInfo(BaseModel):
    student_id: str = Field(..., examples=["202312345"])
    name: str = Field(..., examples=["홍길동"])


class MeetingRoomBookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: int
    facility_id: int
    room_number: int
    start_time: datetime = Field(..., examples=["2025-12-20T17:17:27"])
    end_time: datetime = Field(..., examples=["2025-12-20T18:17:27"])
    participants: List[BookingParticipantInfo]


class LaptopSeatBookingCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "seat_number": 37,
                    "date": "2025-12-20",
                    "start_time": "17:00:00",
                    "end_time": "21:00:00",
                }
            ]
        }
    )

    seat_number: int
    date: date
    start_time: time
    end_time: time


class LaptopSeatBookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    booking_id: int
    facility_id: int
    seat_number: int
    start_time: datetime = Field(..., examples=["2025-12-20T17:17:27"])
    end_time: datetime = Field(..., examples=["2025-12-20T18:17:27"])


class LaptopSeatRandomBookingCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "date": "2025-12-20",
                    "start_time": "17:00:00",
                    "end_time": "21:00:00",
                }
            ]
        }
    )

    date: date
    start_time: time
    end_time: time


class MyBooking(BaseModel):
    booking_id: int
    resource_type: str
    resource_number: int
    start_time: datetime = Field(..., examples=["2025-12-20T17:17:27"])
    end_time: datetime = Field(..., examples=["2025-12-20T18:17:27"])
    status: str
