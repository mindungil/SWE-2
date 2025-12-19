from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import jwt
from jwt import InvalidTokenError

from app.core import settings


def create_access_token(subject: str) -> str:
    expire = datetime.now(tz=timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"sub": subject, "exp": expire}
    token = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token


def decode_access_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


TokenDecodeError = InvalidTokenError
