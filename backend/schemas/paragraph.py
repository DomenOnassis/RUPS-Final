from sqlmodel import SQLModel
from typing import Optional

class ParagraphCreate(SQLModel):
    story_id: int
    content: str
    drawing: Optional[str] = None
    order: int = 0
    paragraph_type: str = "text"  # 'text' or 'circuit'
    circuit_instruction: Optional[str] = None

class ParagraphUpdate(SQLModel):
    story_id: Optional[int] = None
    content: Optional[str] = None
    drawing: Optional[str] = None
    order: Optional[int] = None
    paragraph_type: Optional[str] = None
    circuit_instruction: Optional[str] = None
    vezalko_circuit_id: Optional[int] = None

class ParagraphRead(SQLModel):
    id: int
    story_id: int
    user_id: int
    content: str
    drawing: Optional[str] = None
    order: int
    paragraph_type: str = "text"
    circuit_instruction: Optional[str] = None
    vezalko_circuit_id: Optional[int] = None