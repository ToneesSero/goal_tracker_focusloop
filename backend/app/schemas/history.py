from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class HistoryEntry(BaseModel):
    date: date
    delta: float
    note: Optional[str]
    after: float
    pct: int

    class Config:
        from_attributes = True


class GoalHistoryResponse(BaseModel):
    initial: float
    rows: List[HistoryEntry]
