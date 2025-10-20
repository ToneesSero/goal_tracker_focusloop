from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    unit: str = Field(..., min_length=1, max_length=50)
    target: float = Field(..., gt=0)
    color: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")
    deadline: Optional[date] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    current: Optional[float] = Field(None, ge=0)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    deadline: Optional[date] = None


class ProgressUpdate(BaseModel):
    delta: float
    note: Optional[str] = None


class GoalResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    unit: str
    target: float
    current: float
    color: str
    deadline: Optional[date]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
