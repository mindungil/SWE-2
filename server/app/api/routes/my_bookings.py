from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
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


@router.delete("/my-bookings/{booking_id}", status_code=status.HTTP_200_OK)
def cancel_my_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_student_id == current_user.student_id)
        .first()
    )

    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only confirmed bookings can be canceled.")

    now = datetime.now()
    if booking.start_time <= now + timedelta(hours=2):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel within 2 hours of start.")

    booking.status = BookingStatus.CANCELED
    db.add(booking)
    db.commit()
