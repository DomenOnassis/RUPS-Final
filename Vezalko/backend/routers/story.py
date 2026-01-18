from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from schemas.story import StoryCreate, StoryRead, StoryUpdate
from crud.story import create_story, get_all_stories, get_story_by_id, update_story, delete_story
from crud.class_crud import remove_story_from_class, get_all_classes
from database import get_session

router = APIRouter(prefix="/api/stories", tags=["stories"])

@router.get("", response_model=dict)
def get_stories(session: Session = Depends(get_session)):
    stories = get_all_stories(session)
    return {"data": stories}

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_story_endpoint(story_in: StoryCreate, session: Session = Depends(get_session)):
    story = create_story(session, story_in)
    return {"data": story}

@router.patch("/{story_id}", response_model=dict)
def update_story_endpoint(
    story_id: int,
    story_update: StoryUpdate,
    session: Session = Depends(get_session)
):
    updated_story = update_story(session, story_id, story_update)
    if not updated_story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    return {"data": updated_story}

@router.delete("/{story_id}", response_model=dict)
def delete_story_endpoint(story_id: int, session: Session = Depends(get_session)):
    story = get_story_by_id(session, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Remove story from all classes
    classes = get_all_classes(session)
    for class_obj in classes:
        remove_story_from_class(session, class_obj.id, story_id)
    
    success = delete_story(session, story_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete story")
    
    return {"data": story_id}