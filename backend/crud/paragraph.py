from sqlmodel import Session, select
from models.paragraph import Paragraph
from schemas.paragraph import ParagraphCreate, ParagraphUpdate
from typing import Optional, List

def create_paragraph(session: Session, paragraph_in: ParagraphCreate, user_id: int) -> Paragraph:
    paragraph = Paragraph(
        story_id=paragraph_in.story_id,
        user_id=user_id,
        content=paragraph_in.content,
        drawing=paragraph_in.drawing,
        order=paragraph_in.order
    )
    session.add(paragraph)
    session.commit()
    session.refresh(paragraph)
    return paragraph

def get_paragraph_by_id(session: Session, paragraph_id: int) -> Optional[Paragraph]:
    return session.get(Paragraph, paragraph_id)

def get_paragraphs_by_story(session: Session, story_id: int) -> List[Paragraph]:
    statement = select(Paragraph).where(Paragraph.story_id == story_id).order_by(Paragraph.order)
    return list(session.exec(statement).all())

def get_paragraphs_by_user(session: Session, user_id: int) -> List[Paragraph]:
    statement = select(Paragraph).where(Paragraph.user_id == user_id)
    return list(session.exec(statement).all())

def update_paragraph(session: Session, paragraph_id: int, paragraph_update: ParagraphUpdate) -> Optional[Paragraph]:
    paragraph = session.get(Paragraph, paragraph_id)
    if not paragraph:
        return None
    
    update_data = paragraph_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(paragraph, key, value)
    
    session.add(paragraph)
    session.commit()
    session.refresh(paragraph)
    return paragraph

def delete_paragraph(session: Session, paragraph_id: int) -> bool:
    paragraph = session.get(Paragraph, paragraph_id)
    if not paragraph:
        return False
    
    session.delete(paragraph)
    session.commit()
    return True