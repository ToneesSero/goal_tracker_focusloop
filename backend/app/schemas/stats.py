from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class FastestGoal(BaseModel):
    goal_id: UUID
    name: str
    days: int
    created_at: date
    completed_at: date
    color: str


class Streaks(BaseModel):
    current: int
    longest: int


class ActivityPoint(BaseModel):
    date: date
    value: int


class UserStatsResponse(BaseModel):
    total: int
    completed: int
    rate: int
    fastest_goal: Optional[FastestGoal]
    streaks: Streaks
    activity_series: List[ActivityPoint]
    avg_days_to_complete: int
    active_rate: int
    completed_in_last_30_days: int
