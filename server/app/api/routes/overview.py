from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.booking import Booking, BookingStatus
from app.models.facility import Facility, FacilityResourceType
from app.schemas.overview import (
    LaptopSeatStatus,
    MeetingRoomStatus,
    OverviewResponse,
    ResourceStatus,
)

router = APIRouter(tags=["overview"])


def _is_booked_for_time(db: Session, facility_id: int, target_dt: datetime) -> bool:
    exists = (
        db.query(Booking.id)
        .filter(
            Booking.facility_id == facility_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time <= target_dt,
            Booking.end_time > target_dt,
        )
        .first()
    )
    return exists is not None


@router.get("/api/overview", response_model=OverviewResponse)
def get_overview(
    date_param: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
) -> OverviewResponse:
    now = datetime.now()
    target_dt = datetime.combine(date_param, now.time())

    meeting_rooms = (
        db.query(Facility)
        .filter(
            Facility.resource_type == FacilityResourceType.MEETING_ROOM,
            Facility.is_active.is_(True),
        )
        .order_by(Facility.resource_number)
        .all()
    )
    laptop_seats = (
        db.query(Facility)
        .filter(
            Facility.resource_type == FacilityResourceType.LAPTOP_SEAT,
            Facility.is_active.is_(True),
        )
        .order_by(Facility.resource_number)
        .all()
    )

    meeting_room_statuses = [
        MeetingRoomStatus(
            room_number=room.resource_number,
            status=ResourceStatus.BOOKED if _is_booked_for_time(db, room.id, target_dt) else ResourceStatus.AVAILABLE,
        )
        for room in meeting_rooms
    ]
    laptop_seat_statuses = [
        LaptopSeatStatus(
            seat_number=seat.resource_number,
            status=ResourceStatus.BOOKED if _is_booked_for_time(db, seat.id, target_dt) else ResourceStatus.AVAILABLE,
        )
        for seat in laptop_seats
    ]

    return OverviewResponse(
        date=date_param,
        checked_at=now,
        meeting_rooms=meeting_room_statuses,
        laptop_seats=laptop_seat_statuses,
    )
