from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    student_id: str = Field(..., examples=["202312345"])
    birth: str = Field(..., examples=["2000-01-01"])


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
