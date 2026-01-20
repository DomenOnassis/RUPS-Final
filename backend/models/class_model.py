from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from models.user import User
    from models.story import Story

# Link tables for many-to-many relationships
class ClassStudent(SQLModel, table=True):
    __tablename__ = "class_students"
    
    class_id: int = Field(foreign_key="classes.id", primary_key=True)
    student_id: int = Field(foreign_key="users.id", primary_key=True)

class ClassStory(SQLModel, table=True):
    __tablename__ = "class_stories"
    
    class_id: int = Field(foreign_key="classes.id", primary_key=True)
    story_id: int = Field(foreign_key="stories.id", primary_key=True)

class Class(SQLModel, table=True):
    __tablename__ = "classes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    class_name: str
    teacher_id: int = Field(foreign_key="users.id")
    color: str = Field(default="#57E6FF")
    finalized_stories: Optional[str] = Field(default=None)  # JSON string for finalized stories with paragraphs
    
    # Relationships
    teacher: "User" = Relationship(
        back_populates="taught_classes",
        sa_relationship_kwargs={"foreign_keys": "[Class.teacher_id]"}
    )
    students: List["User"] = Relationship(
        back_populates="enrolled_classes",
        sa_relationship_kwargs={
            "secondary": "class_students",
            "overlaps": "taught_classes"
        }
    )
    stories: List["Story"] = Relationship(
        back_populates="classes",
        sa_relationship_kwargs={"secondary": "class_stories"}
    )