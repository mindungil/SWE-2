from pydantic import BaseModel, Field


class ItemBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: int

    model_config = {"from_attributes": True}
