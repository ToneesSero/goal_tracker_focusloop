from datetime import datetime, date as date_type
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.checkin import CheckIn
from app.models.goal import Goal
from app.models.goal_history import GoalHistory
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate, ProgressUpdate
from app.schemas.history import GoalHistoryResponse, HistoryEntry

router = APIRouter(prefix="/api/goals", tags=["goals"])


def create_checkin(db: Session, user_id, today: date_type):
    """Create or get checkin for today."""
    existing = (
        db.query(CheckIn)
        .filter(
            CheckIn.user_id == user_id,
            CheckIn.date == today,
        )
        .first()
    )
    if not existing:
        checkin = CheckIn(user_id=user_id, date=today)
        db.add(checkin)
        db.commit()


@router.get("", response_model=List[GoalResponse])
def get_goals(
    status_filter: Optional[str] = Query(None, alias="status"),
    color: Optional[str] = None,
    sort: str = "deadline_asc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Goal).filter(Goal.user_id == current_user.id)

    today = date_type.today()
    if status_filter == "completed":
        query = query.filter(Goal.completed_at.isnot(None))
    elif status_filter == "active":
        query = query.filter(Goal.completed_at.is_(None))
    elif status_filter == "overdue":
        query = query.filter(
            Goal.completed_at.is_(None),
            Goal.deadline.isnot(None),
            Goal.deadline < today,
        )

    if color:
        query = query.filter(Goal.color == color.upper())

    if sort == "name_asc":
        query = query.order_by(Goal.name)
    elif sort == "progress_desc":
        query = query.order_by((Goal.current / Goal.target).desc())
    elif sort == "deadline_desc":
        query = query.order_by(Goal.deadline.desc().nullslast())
    else:
        query = query.order_by(Goal.deadline.asc().nullslast())

    goals = query.all()
    return goals


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if goal_data.deadline and goal_data.deadline < date_type.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deadline cannot be in the past",
        )

    new_goal = Goal(
        user_id=current_user.id,
        name=goal_data.name,
        unit=goal_data.unit,
        target=goal_data.target,
        color=goal_data.color.upper(),
        deadline=goal_data.deadline,
        current=0.0,
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    create_checkin(db, current_user.id, date_type.today())

    return new_goal


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    goal_data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    update_data = goal_data.dict(exclude_unset=True)
    if "color" in update_data and update_data["color"] is not None:
        update_data["color"] = update_data["color"].upper()

    if "deadline" in update_data and update_data["deadline"] is not None:
        if update_data["deadline"] < date_type.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deadline cannot be in the past",
            )

    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)

    create_checkin(db, current_user.id, date_type.today())

    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    db.delete(goal)
    db.commit()
    return None


@router.post("/{goal_id}/progress", response_model=GoalResponse)
def update_progress(
    goal_id: str,
    progress_data: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    new_current = max(0, goal.current + progress_data.delta)
    goal.current = new_current

    history_entry = GoalHistory(
        goal_id=goal.id,
        date=date_type.today(),
        delta=progress_data.delta,
        note=progress_data.note,
    )
    db.add(history_entry)

    if new_current >= goal.target and not goal.completed_at:
        goal.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(goal)

    create_checkin(db, current_user.id, date_type.today())

    return goal


@router.post("/{goal_id}/complete", response_model=GoalResponse)
def complete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    delta = goal.target - goal.current
    goal.current = goal.target
    goal.completed_at = datetime.utcnow()

    if delta != 0:
        history_entry = GoalHistory(
            goal_id=goal.id,
            date=date_type.today(),
            delta=delta,
            note="Отмечено как выполненное",
        )
        db.add(history_entry)

    db.commit()
    db.refresh(goal)

    create_checkin(db, current_user.id, date_type.today())

    return goal


@router.get("/{goal_id}/history", response_model=GoalHistoryResponse)
def get_goal_history(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = (
        db.query(Goal)
        .filter(
            Goal.id == goal_id,
            Goal.user_id == current_user.id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    history = (
        db.query(GoalHistory)
        .filter(GoalHistory.goal_id == goal.id)
        .order_by(GoalHistory.date)
        .all()
    )

    total_delta = sum(h.delta for h in history)
    initial = max(0, goal.current - total_delta)

    rows = []
    acc = initial
    for entry in history:
        acc += entry.delta
        done = min(acc, goal.target)
        pct = int((done / goal.target) * 100) if goal.target > 0 else 0
        rows.append(
            HistoryEntry(
                date=entry.date,
                delta=entry.delta,
                note=entry.note,
                after=acc,
                pct=pct,
            )
        )

    return GoalHistoryResponse(initial=initial, rows=rows)
