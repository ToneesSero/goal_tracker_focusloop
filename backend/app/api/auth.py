from datetime import timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends, Form, HTTPException, status, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
    verify_telegram_auth,
    verify_telegram_web_app_data,
)
from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


class LoginForm:
    def __init__(
        self,
        username: str = Form(...),
        password: str = Form(...),
        scope: str = Form(default=""),
        grant_type: str | None = Form(default=None, pattern="password"),
        client_id: str | None = Form(default=None),
        client_secret: str | None = Form(default=None),
    ):
        self.username = username
        self.password = password
        self.scopes = scope.split()
        self.grant_type = grant_type
        self.client_id = client_id
        self.client_secret = client_secret


@router.post("/login", response_model=Token)
def login(form_data: LoginForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


class TelegramAuthData(BaseModel):
    id: int
    first_name: str
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str


@router.post("/telegram", response_model=Token)
def telegram_login(auth_data: TelegramAuthData, db: Session = Depends(get_db)):
    """
    Authenticate user via Telegram Login Widget
    """
    # Convert to dict for verification
    auth_dict = auth_data.model_dump(exclude_none=True)

    # Verify Telegram data
    if not verify_telegram_auth(auth_dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data"
        )

    # Find or create user
    user = db.query(User).filter(User.telegram_id == auth_data.id).first()

    if not user:
        # Create new user
        name = auth_data.first_name
        if auth_data.last_name:
            name += f" {auth_data.last_name}"

        user = User(
            telegram_id=auth_data.id,
            name=name,
            email=None,
            hashed_password=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create access token with 36 hours expiration
    access_token_expires = timedelta(hours=36)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


class TelegramWebAppData(BaseModel):
    initData: str


@router.post("/telegram-miniapp", response_model=Token)
def telegram_miniapp_login(data: TelegramWebAppData, db: Session = Depends(get_db)):
    """
    Authenticate user via Telegram Mini App
    """
    # Verify Telegram Web App data
    verified_data = verify_telegram_web_app_data(data.initData)

    if not verified_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram Mini App data"
        )

    # Extract user data
    user_data = verified_data.get('user')
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User data not found in initData"
        )

    telegram_id = user_data.get('id')
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram ID not found"
        )

    # Find or create user
    user = db.query(User).filter(User.telegram_id == telegram_id).first()

    if not user:
        # Create new user
        first_name = user_data.get('first_name', 'User')
        last_name = user_data.get('last_name', '')
        name = f"{first_name} {last_name}".strip()

        user = User(
            telegram_id=telegram_id,
            name=name,
            email=None,
            hashed_password=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Create access token with 36 hours expiration
    access_token_expires = timedelta(hours=36)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}
