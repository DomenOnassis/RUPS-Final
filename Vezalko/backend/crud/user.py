from sqlmodel import Session, select
from models.user import User
from schemas.user import UserCreate, UserUpdate
from core.security import get_password_hash, verify_password
from utils import generate_unique_code
from typing import Optional, List

def create_user(session: Session, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    
    user_data = {
        "name": user_in.name,
        "surname": user_in.surname,
        "email": user_in.email,
        "password": hashed_password,
        "type": user_in.type
    }
    
    # Generate unique code for students
    if user_in.type == "student":
        code = generate_unique_code(8)
        while get_user_by_code(session, code):
            code = generate_unique_code(8)
        user_data["code"] = code
    
    user = User(**user_data)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def get_user_by_code(session: Session, code: str) -> Optional[User]:
    statement = select(User).where(User.code == code)
    return session.exec(statement).first()

def get_user_by_id(session: Session, user_id: int) -> Optional[User]:
    return session.get(User, user_id)

def get_all_users(session: Session) -> List[User]:
    statement = select(User)
    return list(session.exec(statement).all())

def update_user(session: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    user = session.get(User, user_id)
    if not user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])
    
    for key, value in update_data.items():
        setattr(user, key, value)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def delete_user(session: Session, user_id: int) -> bool:
    user = session.get(User, user_id)
    if not user:
        return False
    
    session.delete(user)
    session.commit()
    return True

def authenticate_user(session: Session, email: Optional[str] = None, password: Optional[str] = None, code: Optional[str] = None) -> Optional[User]:
    if code:
        user = get_user_by_code(session, code)
        return user if user else None
    
    if email and password:
        user = get_user_by_email(session, email)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user
    
    return None