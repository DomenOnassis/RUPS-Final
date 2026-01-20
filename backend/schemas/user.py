from sqlmodel import SQLModel
from typing import Optional, List

class UserCreate(SQLModel):
    name: str
    surname: str
    email: str
    password: str
    type: str = "student"  # "student" or "teacher"

class UserUpdate(SQLModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserRead(SQLModel):
    id: int
    name: str
    surname: str
    email: str
    type: str
    code: Optional[str] = None
    is_active: bool

class UserLogin(SQLModel):
    email: Optional[str] = None
    password: Optional[str] = None
    code: Optional[str] = None

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"