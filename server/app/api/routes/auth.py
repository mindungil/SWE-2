from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse
from app.security import create_access_token

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.query(User).filter(User.student_id == payload.student_id).first()
    if not user or user.birth != payload.birth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid student_id or birth.",
        )

    token = create_access_token(subject=user.student_id)
    return LoginResponse(access_token=token)
