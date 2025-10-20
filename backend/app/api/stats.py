from datetime import date as date_type, timedelta
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.checkin import CheckIn
from app.models.goal import Goal
from app.models.user import User
from app.schemas.stats import ActivityPoint, FastestGoal, Streaks, UserStatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])


def calculate_streaks(checkins: List[CheckIn]) -> Streaks:
    """Calculate current and longest streaks for a user."""
    if not checkins:
        return Streaks(current=0, longest=0)

    dates = sorted(set(c.date for c in checkins))
    today = date_type.today()

    current = 0
    check_date = today
    while check_date in dates:
        current += 1
        check_date -= timedelta(days=1)

    longest = 0
    streak = 1
    for idx in range(1, len(dates)):
        if (dates[idx] - dates[idx - 1]).days == 1:
            streak += 1
        else:
            longest = max(longest, streak)
            streak = 1
    longest = max(longest, streak)

    return Streaks(current=current, longest=longest)


@router.get("", response_model=UserStatsResponse)
def get_user_stats(
    period: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    completed_goals = [goal for goal in goals if goal.completed_at is not None]

    total = len(goals)
    completed = len(completed_goals)
    rate = int((completed / total) * 100) if total > 0 else 0

    fastest = None
    if completed_goals:
        fastest_goal = min(
            completed_goals,
            key=lambda g: (g.completed_at.date() - g.created_at.date()).days,
        )
        days = (fastest_goal.completed_at.date() - fastest_goal.created_at.date()).days
        fastest = FastestGoal(
            goal_id=fastest_goal.id,
            name=fastest_goal.name,
            days=days,
            created_at=fastest_goal.created_at.date(),
            completed_at=fastest_goal.completed_at.date(),
            color=fastest_goal.color,
        )

    checkins = db.query(CheckIn).filter(CheckIn.user_id == current_user.id).all()
    streaks = calculate_streaks(checkins)

    today = date_type.today()
    start_date = today - timedelta(days=period - 1)
    checkin_dates = set(c.date for c in checkins)
    activity_series = [
        ActivityPoint(date=start_date + timedelta(days=offset), value=1 if (start_date + timedelta(days=offset)) in checkin_dates else 0)
        for offset in range(period)
    ]

    avg_days = 0
    if completed_goals:
        total_days = sum(
            (goal.completed_at.date() - goal.created_at.date()).days for goal in completed_goals
        )
        avg_days = total_days // len(completed_goals)

    active_count = len([goal for goal in goals if goal.completed_at is None])
    active_rate = int((active_count / total) * 100) if total > 0 else 0

    thirty_days_ago = today - timedelta(days=30)
    completed_last_30 = len(
        [
            goal
            for goal in completed_goals
            if goal.completed_at.date() >= thirty_days_ago
        ]
    )

    return UserStatsResponse(
        total=total,
        completed=completed,
        rate=rate,
        fastest_goal=fastest,
        streaks=streaks,
        activity_series=activity_series,
        avg_days_to_complete=avg_days,
        active_rate=active_rate,
        completed_in_last_30_days=completed_last_30,
    )
