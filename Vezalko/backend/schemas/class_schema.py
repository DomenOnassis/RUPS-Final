from sqlmodel import SQLModel
from typing import Optional, List, Any
from schemas.user import UserRead
from schemas.story import StoryRead

class ClassCreate(SQLModel):
    class_name: str
    teacher: int
    students: List[int] = []
    stories: List[int] = []
    color: str = "#57E6FF"

class ClassUpdate(SQLModel):
    class_name: Optional[str] = None
    students: Optional[List[int]] = None
    stories: Optional[List[int]] = None
    color: Optional[str] = None

class ClassRead(SQLModel):
    id: int
    class_name: str
    teacher_id: int
    color: str

class ClassReadWithRelations(SQLModel):
    id: int
    class_name: str
    teacher_id: int
    color: str
    teacher: Optional[UserRead] = None
    students: List[UserRead] = []
    stories: List[StoryRead] = []
    finalized_stories: Optional[Any] = None

class FinalizedStoryCreate(SQLModel):
    story_id: int
    images: List[str] = []

class FinalizedStoryImageAdd(SQLModel):
    image: str