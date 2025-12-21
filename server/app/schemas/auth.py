from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    student_id: str = Field(..., examples=["202519198"])
    birth: str = Field(..., examples=["2006-05-22"])


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
