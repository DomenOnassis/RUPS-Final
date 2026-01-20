from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from models.story import Story
    from models.user import User

class Paragraph(SQLModel, table=True):
    __tablename__ = "paragraphs"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    story_id: int = Field(foreign_key="stories.id")
    user_id: int = Field(foreign_key="users.id")
    content: str
    drawing: Optional[str] = Field(default=None)  # Base64 or URL
    order: int = Field(default=0)
    paragraph_type: str = Field(default="text")
    circuit_instruction: Optional[str] = Field(default=None)
    vezalko_circuit_id: Optional[int] = Field(default=None)
    
    # Relationships
    story: "Story" = Relationship(back_populates="paragraphs")
    user: "User" = Relationship(back_populates="paragraphs")