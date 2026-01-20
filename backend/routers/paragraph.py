from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from schemas.paragraph import ParagraphCreate, ParagraphRead, ParagraphUpdate
from crud.paragraph import (
    create_paragraph, 
    get_paragraph_by_id, 
    get_paragraphs_by_story,
    update_paragraph, 
    delete_paragraph
)
from database import get_session

router = APIRouter(prefix="/api", tags=["paragraphs"])

@router.post("/users/{user_id}/paragraphs", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_paragraph(
    user_id: int,
    paragraph_in: ParagraphCreate,
    session: Session = Depends(get_session)
):
    paragraph = create_paragraph(session, paragraph_in, user_id)
    return {"data": paragraph}

@router.get("/paragraphs/{paragraph_id}", response_model=dict)
def get_paragraph(paragraph_id: int, session: Session = Depends(get_session)):
    paragraph = get_paragraph_by_id(session, paragraph_id)
    if not paragraph:
        raise HTTPException(status_code=404, detail="Paragraph not found")
    
    return {"data": paragraph}

@router.get("/stories/{story_id}/paragraphs", response_model=dict)
def get_story_paragraphs(story_id: int, session: Session = Depends(get_session)):
    paragraphs = get_paragraphs_by_story(session, story_id)
    return {"data": paragraphs}

@router.patch("/paragraphs/{paragraph_id}", response_model=dict)
def update_paragraph_endpoint(
    paragraph_id: int,
    paragraph_update: ParagraphUpdate,
    session: Session = Depends(get_session)
):
    updated_paragraph = update_paragraph(session, paragraph_id, paragraph_update)
    if not updated_paragraph:
        raise HTTPException(status_code=404, detail="Paragraph not found")
    
    return {"data": updated_paragraph}

@router.delete("/paragraphs/{paragraph_id}", response_model=dict)
def delete_paragraph_endpoint(paragraph_id: int, session: Session = Depends(get_session)):
    success = delete_paragraph(session, paragraph_id)
    if not success:
        raise HTTPException(status_code=404, detail="Paragraph not found")
    
    return {"data": paragraph_id}