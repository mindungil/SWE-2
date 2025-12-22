import random
from datetime import datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import not_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.booking import Booking, BookingStatus
from app.models.facility import Facility, FacilityResourceType
from app.models.user import User
from app.schemas.booking import (
    LaptopSeatBookingCreate,
    LaptopSeatBookingRead,
    LaptopSeatRandomBookingCreate,
)

router = APIRouter(prefix="/api/laptop-seats", tags=["laptop_seats"])


def _combine_datetime(target_date, target_time):
    return datetime.combine(target_date, target_time)


def _hours_between(start_dt: datetime, end_dt: datetime) -> float:
    return (end_dt - start_dt).total_seconds() / 3600


def _validate_common_time(payload_date, start_time, end_time):
    start_dt = _combine_datetime(payload_date, start_time)
    end_dt = _combine_datetime(payload_date, end_time)
    if start_dt >= end_dt:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invalid time range.")
    return start_dt, end_dt


def _enforce_daily_limit(
    db: Session,
    current_user: User,
    start_dt: datetime,
    end_dt: datetime,
) -> None:
    day_start = _combine_datetime(start_dt.date(), time.min)
    day_end = _combine_datetime(start_dt.date() + timedelta(days=1), time.min)

    existing_day_bookings = (
        db.query(Booking)
        .join(Facility, Booking.facility_id == Facility.id)
        .filter(
            Booking.user_student_id == current_user.student_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time >= day_start,
            Booking.start_time < day_end,
            Facility.resource_type == FacilityResourceType.LAPTOP_SEAT,
        )
        .all()
    )

    limit_hours = 4
    if current_user.daily_limit_laptop:
        limit_hours = min(limit_hours, current_user.daily_limit_laptop)

    total_hours = _hours_between(start_dt, end_dt)
    for b in existing_day_bookings:
        total_hours += _hours_between(b.start_time, b.end_time)

    if total_hours > limit_hours:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Daily laptop seat hour limit exceeded.")


@router.post("/bookings", response_model=LaptopSeatBookingRead, status_code=status.HTTP_201_CREATED)
def create_laptop_seat_booking(
    payload: LaptopSeatBookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LaptopSeatBookingRead:
    start_dt, end_dt = _validate_common_time(payload.date, payload.start_time, payload.end_time)

    facility = (
        db.query(Facility)
        .filter(
            Facility.resource_type == FacilityResourceType.LAPTOP_SEAT,
            Facility.resource_number == payload.seat_number,
            Facility.is_active.is_(True),
        )
        .first()
    )
    if not facility:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat not available.")

    seat_overlap = (
        db.query(Booking)
        .filter(
            Booking.facility_id == facility.id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time < end_dt,
            Booking.end_time > start_dt,
        )
        .first()
    )
    if seat_overlap:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Seat already booked for this time.")

    user_overlap = (
        db.query(Booking)
        .filter(
            Booking.user_student_id == current_user.student_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time < end_dt,
            Booking.end_time > start_dt,
        )
        .first()
    )
    if user_overlap:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User has another booking in this slot.")

    _enforce_daily_limit(db, current_user, start_dt, end_dt)

    booking = Booking(
        facility_id=facility.id,
        user_student_id=current_user.student_id,
        start_time=start_dt,
        end_time=end_dt,
        status=BookingStatus.CONFIRMED,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return LaptopSeatBookingRead(
        booking_id=booking.id,
        facility_id=facility.id,
        seat_number=facility.resource_number,
        start_time=booking.start_time,
        end_time=booking.end_time,
    )


@router.post("/bookings/random", response_model=LaptopSeatBookingRead, status_code=status.HTTP_201_CREATED)
def create_random_laptop_seat_booking(
    payload: LaptopSeatRandomBookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LaptopSeatBookingRead:
    start_dt, end_dt = _validate_common_time(payload.date, payload.start_time, payload.end_time)

    user_overlap = (
        db.query(Booking)
        .filter(
            Booking.user_student_id == current_user.student_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time < end_dt,
            Booking.end_time > start_dt,
        )
        .first()
    )
    if user_overlap:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User has another booking in this slot.")

    # 해당 시간대에 예약이 있는 Facility ID 목록 조회
    booked_facility_ids = (
        db.query(Booking.facility_id)
        .filter(
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time < end_dt,
            Booking.end_time > start_dt,
        )
        .distinct()
        .all()
    )
    booked_facility_ids = [facility_id[0] for facility_id in booked_facility_ids]

    # 예약되지 않은 좌석 조회
    query = (
        db.query(Facility)
        .filter(
            Facility.resource_type == FacilityResourceType.LAPTOP_SEAT,
            Facility.is_active.is_(True),
        )
    )
    if booked_facility_ids:
        query = query.filter(not_(Facility.id.in_(booked_facility_ids)))
    
    available_seats = query.all()

    if not available_seats:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No available seat for this time.")

    _enforce_daily_limit(db, current_user, start_dt, end_dt)

    facility = random.choice(available_seats)

    booking = Booking(
        facility_id=facility.id,
        user_student_id=current_user.student_id,
        start_time=start_dt,
        end_time=end_dt,
        status=BookingStatus.CONFIRMED,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return LaptopSeatBookingRead(
        booking_id=booking.id,
        facility_id=facility.id,
        seat_number=facility.resource_number,
        start_time=booking.start_time,
        end_time=booking.end_time,
    )