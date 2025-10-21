import os
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from urllib.parse import parse_qs

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def verify_telegram_auth(auth_data: Dict[str, Any]) -> bool:
    """
    Verify Telegram Login Widget authentication data.
    Returns True if the data is valid, False otherwise.
    """
    if not TELEGRAM_BOT_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telegram bot token not configured"
        )

    check_hash = auth_data.get('hash')
    if not check_hash:
        return False

    # Remove hash from data
    auth_data_copy = {k: v for k, v in auth_data.items() if k != 'hash'}

    # Create data check string
    data_check_arr = [f"{k}={v}" for k, v in sorted(auth_data_copy.items())]
    data_check_string = '\n'.join(data_check_arr)

    # Calculate hash
    secret_key = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode()).digest()
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256
    ).hexdigest()

    # Verify hash
    if calculated_hash != check_hash:
        return False

    # Check auth_date (should not be older than 24 hours)
    auth_date = auth_data.get('auth_date')
    if auth_date:
        try:
            auth_timestamp = int(auth_date)
            current_timestamp = int(datetime.utcnow().timestamp())
            # 24 hours = 86400 seconds
            if current_timestamp - auth_timestamp > 86400:
                return False
        except (ValueError, TypeError):
            return False

    return True


def verify_telegram_web_app_data(init_data: str) -> Optional[Dict[str, Any]]:
    """
    Verify Telegram Mini App initData.
    Returns parsed data if valid, None otherwise.
    """
    if not TELEGRAM_BOT_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telegram bot token not configured"
        )

    try:
        # Parse init_data
        parsed_data = parse_qs(init_data)

        # Get hash
        hash_value = parsed_data.get('hash', [None])[0]
        if not hash_value:
            return None

        # Remove hash and create data check string
        data_check_pairs = []
        for key in sorted(parsed_data.keys()):
            if key == 'hash':
                continue
            value = parsed_data[key][0]
            data_check_pairs.append(f"{key}={value}")

        data_check_string = '\n'.join(data_check_pairs)

        # Calculate hash
        secret_key = hmac.new(
            b"WebAppData",
            TELEGRAM_BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()

        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        # Verify hash
        if calculated_hash != hash_value:
            return None

        # Check auth_date
        auth_date = parsed_data.get('auth_date', [None])[0]
        if auth_date:
            try:
                auth_timestamp = int(auth_date)
                current_timestamp = int(datetime.utcnow().timestamp())
                # 24 hours = 86400 seconds
                if current_timestamp - auth_timestamp > 86400:
                    return None
            except (ValueError, TypeError):
                return None

        # Parse user data
        import json
        user_data = parsed_data.get('user', [None])[0]
        if user_data:
            parsed_data['user'] = json.loads(user_data)

        return parsed_data

    except Exception as e:
        return None
