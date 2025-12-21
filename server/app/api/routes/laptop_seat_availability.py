from datetime import datetime, timedelta

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.booking import Booking, BookingStatus
from app.models.facility import Facility, FacilityResourceType
from app.models.user import User
from app.schemas.laptop_seats import (
    LaptopSeatAvailabilityItem,
    LaptopSeatAvailabilityRequest,
    LaptopSeatAvailabilityResponse,
)

router = APIRouter(tags=["laptop_seats"])


@router.get("/api/laptop_seats", response_model=LaptopSeatAvailabilityResponse)
def get_laptop_seat_availability(
    payload: LaptopSeatAvailabilityRequest = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LaptopSeatAvailabilityResponse:
    if payload.date < datetime.now().date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="과거 날짜는 조회할 수 없습니다.")

    start_dt = datetime.combine(payload.date, payload.start_time)
    end_dt = start_dt + timedelta(hours=payload.duration)
    booked_seat_ids = {
        row[0]
        for row in (
            db.query(Booking.facility_id)
            .join(Facility, Booking.facility_id == Facility.id)
            .filter(
                Facility.resource_type == FacilityResourceType.LAPTOP_SEAT,
                Facility.is_active.is_(True),
                Booking.status == BookingStatus.CONFIRMED,
                Booking.start_time < end_dt,
                Booking.end_time > start_dt,
            )
            .distinct()
            .all()
        )
    }

    laptop_seats = (
        db.query(Facility)
        .filter(
            Facility.resource_type == FacilityResourceType.LAPTOP_SEAT,
            Facility.is_active.is_(True),
        )
        .order_by(Facility.resource_number)
        .all()
    )
    available_seats = [
        LaptopSeatAvailabilityItem(
            resource_number=seat.resource_number,
            is_available="false" if seat.id in booked_seat_ids else "true",
        )
        for seat in laptop_seats
    ]
    total_seats = len(laptop_seats)
    available_count = total_seats - len(booked_seat_ids)

    return LaptopSeatAvailabilityResponse(
        date=payload.date,
        start_time=payload.start_time.strftime("%H:%M"),
        end_time=end_dt.strftime("%H:%M"),
        duration=payload.duration,
        total_seats=total_seats,
        available_seats=available_seats,
        available_count=available_count,
        occupied_count=total_seats - available_count,
    )
