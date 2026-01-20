from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from models.paragraph import Paragraph
    from models.class_model import Class

class Story(SQLModel, table=True):
    __tablename__ = "stories"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    author: str
    short_description: str
    content: str
    is_finished: bool = Field(default=False)
    
    # Relationships
    paragraphs: List["Paragraph"] = Relationship(back_populates="story")
    classes: List["Class"] = Relationship(
        back_populates="stories",
        sa_relationship_kwargs={"secondary": "class_stories"}
    )