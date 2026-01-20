from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from models.paragraph import Paragraph
    from models.class_model import Class

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    surname: str
    email: str = Field(index=True, unique=True)
    password: str  # Will store hashed password
    type: str = Field(default="student")  # "student" or "teacher"
    code: Optional[str] = Field(default=None, index=True, unique=True)  # Only for students
    is_active: bool = Field(default=True)
    
    # Relationships
    paragraphs: List["Paragraph"] = Relationship(back_populates="user")
    taught_classes: List["Class"] = Relationship(
        back_populates="teacher",
        sa_relationship_kwargs={"foreign_keys": "[Class.teacher_id]"}
    )
    enrolled_classes: List["Class"] = Relationship(
        back_populates="students",
        sa_relationship_kwargs={"overlaps": "taught_classes"}
    )