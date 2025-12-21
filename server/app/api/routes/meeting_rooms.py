from datetime import datetime, time, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.booking import Booking, BookingStatus
from app.models.booking_participant import BookingParticipant
from app.models.facility import Facility, FacilityResourceType
from app.models.user import User
from app.schemas.booking import (
    BookingParticipantInfo,
    MeetingRoomBookingCreate,
    MeetingRoomBookingRead,
)

router = APIRouter(prefix="/api/meeting-rooms", tags=["meeting_rooms"])


def _combine_datetime(target_date, target_time):
    return datetime.combine(target_date, target_time)


def _sum_user_booking_hours(db: Session, user: User, period_start: datetime, period_end: datetime) -> float:
    bookings = (
        db.query(Booking)
        .filter(
            Booking.user_student_id == user.student_id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time >= period_start,
            Booking.start_time < period_end,
        )
        .all()
    )
    total_hours = 0.0
    for booking in bookings:
        total_hours += (booking.end_time - booking.start_time).total_seconds() / 3600
    return total_hours


def _enforce_user_meeting_limits(
    db: Session,
    user: User,
    start_dt: datetime,
    end_dt: datetime,
    day_start: datetime,
    day_end: datetime,
    week_start: datetime,
    week_end: datetime,
) -> None:
    duration_hours = (end_dt - start_dt).total_seconds() / 3600
    daily_hours = _sum_user_booking_hours(db, user, day_start, day_end) + duration_hours
    if user.daily_limit_meeting and daily_hours > user.daily_limit_meeting:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Daily meeting room limit exceeded.")

    weekly_hours = _sum_user_booking_hours(db, user, week_start, week_end) + duration_hours
    if user.weekly_limit_meeting and weekly_hours > user.weekly_limit_meeting:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Weekly meeting room limit exceeded.")


@router.post("/bookings", response_model=MeetingRoomBookingRead, status_code=status.HTTP_201_CREATED)
def create_meeting_room_booking(
    payload: MeetingRoomBookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeetingRoomBookingRead:
    start_dt = _combine_datetime(payload.date, payload.start_time)
    end_dt = _combine_datetime(payload.date, payload.end_time)

    if start_dt >= end_dt:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invalid time range.")

    facility = (
        db.query(Facility)
        .filter(
            Facility.resource_type == FacilityResourceType.MEETING_ROOM,
            Facility.resource_number == payload.room_number,
            Facility.is_active.is_(True),
        )
        .first()
    )
    if not facility:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Meeting room not available.")

    companion_ids = [c.student_id for c in payload.companions]
    if current_user.student_id in companion_ids:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Host cannot be a companion.")
    if len(companion_ids) != len(set(companion_ids)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Duplicate companion detected.")

    companions: List[User] = []
    if companion_ids:
        companions = db.query(User).filter(User.student_id.in_(companion_ids)).all()
        if len(companions) != len(companion_ids):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Companion not found.")

        companion_name_map = {u.student_id: u.name for u in companions}
        for comp in payload.companions:
            if companion_name_map.get(comp.student_id) and companion_name_map[comp.student_id] != comp.name:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Companion name mismatch for {comp.student_id}.",
                )

    overlap_exists = (
        db.query(Booking)
        .filter(
            Booking.facility_id == facility.id,
            Booking.status == BookingStatus.CONFIRMED,
            Booking.start_time < end_dt,
            Booking.end_time > start_dt,
        )
        .first()
    )
    if overlap_exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Meeting room already booked.")

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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already booked at this time.")

    day_start = _combine_datetime(payload.date, time.min)
    day_end = _combine_datetime(payload.date + timedelta(days=1), time.min)
    week_start_date = payload.date - timedelta(days=payload.date.weekday())
    week_end_date = week_start_date + timedelta(days=7)
    week_start = _combine_datetime(week_start_date, time.min)
    week_end = _combine_datetime(week_end_date, time.min)

    participants_for_limits = [current_user, *companions]
    for participant in participants_for_limits:
        _enforce_user_meeting_limits(db, participant, start_dt, end_dt, day_start, day_end, week_start, week_end)

    booking = Booking(
        facility_id=facility.id,
        user_student_id=current_user.student_id,
        start_time=start_dt,
        end_time=end_dt,
        status=BookingStatus.CONFIRMED,
    )
    db.add(booking)
    db.flush()

    participants = [BookingParticipant(booking_id=booking.id, student_id=current_user.student_id)]
    participants.extend(
        BookingParticipant(booking_id=booking.id, student_id=comp.student_id) for comp in payload.companions
    )
    db.add_all(participants)
    db.commit()
    db.refresh(booking)

    participant_infos = [BookingParticipantInfo(student_id=current_user.student_id, name=current_user.name)]
    participant_infos.extend(
        BookingParticipantInfo(student_id=comp.student_id, name=comp.name) for comp in payload.companions
    )

    return MeetingRoomBookingRead(
        booking_id=booking.id,
        facility_id=facility.id,
        room_number=facility.resource_number,
        start_time=booking.start_time,
        end_time=booking.end_time,
        participants=participant_infos,
    )
