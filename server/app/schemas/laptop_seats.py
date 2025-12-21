from datetime import date as DateType
from datetime import time
from typing import List

from pydantic import BaseModel, Field


class LaptopSeatAvailabilityRequest(BaseModel):
    date: DateType = Field(..., examples=["2025-12-20"])
    start_time: time = Field(..., examples=["13:00"])
    duration: int = Field(..., examples=[2])


class LaptopSeatAvailabilityItem(BaseModel):
    resource_number: int = Field(..., examples=[1])
    is_available: bool = Field(..., examples=[True])


class LaptopSeatAvailabilityResponse(BaseModel):
    date: DateType = Field(..., examples=["2025-12-20"])
    start_time: str = Field(..., examples=["13:00"])
    end_time: str = Field(..., examples=["15:00"])
    duration: int = Field(..., examples=[2])
    total_seats: int = Field(..., examples=[70])
    available_seats: List[LaptopSeatAvailabilityItem]
    available_count: int = Field(..., examples=[4])
    occupied_count: int = Field(..., examples=[66])
