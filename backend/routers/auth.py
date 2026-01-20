from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Optional
from sqlmodel import Session

from schemas.user import UserCreate, UserRead, UserLogin, Token
from crud.user import create_user, authenticate_user, get_user_by_email
from core import security
from database import get_session

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    existing_email = get_user_by_email(session, user_in.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if user_in.type not in ["student", "teacher"]:
        raise HTTPException(status_code=400, detail="Invalid user type")
    
    user = create_user(session, user_in)
    return user


@router.post("/login", response_model=dict)
def login(login_data: UserLogin, session: Session = Depends(get_session)):
    user = authenticate_user(
        session, 
        email=login_data.email, 
        password=login_data.password, 
        code=login_data.code
    )
    
    if not user:
        if login_data.code:
            raise HTTPException(status_code=404, detail="Napačen ključ")
        else:
            raise HTTPException(status_code=404, detail="Napačna e-pošta ali geslo")
    
    # Generate token using email instead of username
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email, "user_id": user.id}, 
        expires_delta=access_token_expires
    )
    
    return {
        "data": user,
        "access_token": access_token,
        "token_type": "bearer"
    }


def _get_bearer_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        return None
    return authorization.split(" ", 1)[1]


@router.get("/verify-token")
def verify_token(token: Optional[str] = Depends(_get_bearer_token), session: Session = Depends(get_session)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = security.decode_access_token(token)
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user_by_email(session, email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {
        "name": user.name,
        "surname": user.surname,
        "email": user.email,
        "id": user.id,
        "type": user.type,
        "code": user.code
    }


def get_current_user(token: str = Depends(_get_bearer_token), session: Session = Depends(get_session)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = security.decode_access_token(token)
        email: str = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = get_user_by_email(session, email)

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user