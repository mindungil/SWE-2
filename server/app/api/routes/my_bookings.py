from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.booking import Booking, BookingStatus
from app.models.facility import Facility, FacilityResourceType
from app.models.user import User
from app.schemas.booking import MyBooking

router = APIRouter(prefix="/api", tags=["my_bookings"])


@router.get("/my-bookings", response_model=list[MyBooking])
def list_my_bookings(
    status: BookingStatus = Query(BookingStatus.CONFIRMED),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MyBooking]:
    rows = (
        db.query(Booking, Facility)
        .join(Facility, Booking.facility_id == Facility.id)
        .filter(
            Booking.user_student_id == current_user.student_id,
            Booking.status == status,
        )
        .order_by(Booking.start_time.desc())
        .all()
    )

    results: list[MyBooking] = []
    for booking, facility in rows:
        results.append(
            MyBooking(
                booking_id=booking.id,
                resource_type=facility.resource_type.value,
                resource_number=facility.resource_number,
                start_time=booking.start_time,
                end_time=booking.end_time,
                status=booking.status.value,
            )
        )

    return results
