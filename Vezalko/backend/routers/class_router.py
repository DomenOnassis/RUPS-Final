from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
import json

from schemas.class_schema import ClassCreate, ClassUpdate, ClassReadWithRelations, FinalizedStoryCreate
from crud.class_crud import (
    create_class, 
    get_all_classes, 
    get_class_by_id,
    update_class, 
    delete_class,
    remove_student_from_class,
    add_finalized_story,
    remove_story_from_class
)
from crud.paragraph import get_paragraphs_by_story
from crud.story import get_story_by_id
from database import get_session

router = APIRouter(prefix="/api/classes", tags=["classes"])

@router.get("", response_model=dict)
def get_classes(populate: bool = Query(False), session: Session = Depends(get_session)):
    classes = get_all_classes(session, populate=populate)
    
    if populate:
        result = []
        for class_obj in classes:
            class_dict = {
                "id": class_obj.id,
                "class_name": class_obj.class_name,
                "teacher_id": class_obj.teacher_id,
                "color": class_obj.color,
                "teacher": class_obj.teacher,
                "students": class_obj.students,
                "stories": class_obj.stories,
                "finalized_stories": json.loads(class_obj.finalized_stories) if class_obj.finalized_stories else []
            }
            result.append(class_dict)
        return {"data": result}
    
    return {"data": classes}

@router.get("/{class_id}", response_model=dict)
def get_class(class_id: int, populate: bool = Query(False), session: Session = Depends(get_session)):
    class_obj = get_class_by_id(session, class_id, populate=populate)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    if populate:
        class_dict = {
            "id": class_obj.id,
            "class_name": class_obj.class_name,
            "teacher_id": class_obj.teacher_id,
            "color": class_obj.color,
            "teacher": class_obj.teacher,
            "students": class_obj.students,
            "stories": class_obj.stories,
            "finalized_stories": json.loads(class_obj.finalized_stories) if class_obj.finalized_stories else []
        }
        return {"data": class_dict}
    
    return {"data": class_obj}

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_class_endpoint(class_in: ClassCreate, session: Session = Depends(get_session)):
    new_class = create_class(session, class_in)
    return {"data": new_class}

@router.patch("/{class_id}", response_model=dict)
def update_class_endpoint(
    class_id: int,
    class_update: ClassUpdate,
    session: Session = Depends(get_session)
):
    updated_class = update_class(session, class_id, class_update)
    if not updated_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return {"data": updated_class}

@router.delete("/{class_id}", response_model=dict)
def delete_class_endpoint(class_id: int, session: Session = Depends(get_session)):
    success = delete_class(session, class_id)
    if not success:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return {"data": class_id}

@router.delete("/{class_id}/students/{student_id}", response_model=dict)
def remove_student(class_id: int, student_id: int, session: Session = Depends(get_session)):
    success = remove_student_from_class(session, class_id, student_id)
    if not success:
        raise HTTPException(status_code=400, detail="No student removed")
    
    return {"data": True}

@router.post("/{class_id}/finalize-story/{story_id}", response_model=dict)
def finalize_story(class_id: int, story_id: int, session: Session = Depends(get_session)):
    # Get story
    story = get_story_by_id(session, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Get paragraphs
    paragraphs = get_paragraphs_by_story(session, story_id)
    if not paragraphs:
        raise HTTPException(status_code=404, detail="No paragraphs found for this story")
    
    # Build finalized story entry
    paragraphs_data = []
    for paragraph in paragraphs:
        paragraphs_data.append({
            "paragraph_id": paragraph.id,
            "content": paragraph.content,
            "drawing": paragraph.drawing,
            "order": paragraph.order
        })
    
    entry = {
        "story_id": story_id,
        "paragraphs": paragraphs_data,
        "story": {
            "title": story.title,
            "short_description": story.short_description,
            "author": story.author
        }
    }
    
    # Add to finalized stories
    updated_class = add_finalized_story(session, class_id, entry)
    if not updated_class:
        raise HTTPException(status_code=400, detail="Could not add finalized story")
    
    # Remove from active stories
    remove_story_from_class(session, class_id, story_id)
    
    return {"data": {
        "message": "Story finalized successfully",
        "paragraphs_count": len(paragraphs_data),
        "entry": entry
    }}