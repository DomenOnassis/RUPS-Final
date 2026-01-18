from sqlmodel import SQLModel
from typing import Optional

class StoryCreate(SQLModel):
    title: str
    author: str
    short_description: str
    content: str

class StoryUpdate(SQLModel):
    title: Optional[str] = None
    author: Optional[str] = None
    short_description: Optional[str] = None
    content: Optional[str] = None
    is_finished: Optional[bool] = None

class StoryRead(SQLModel):
    id: int
    title: str
    author: str
    short_description: str
    content: str
    is_finished: bool