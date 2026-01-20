from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List

from schemas.user import UserRead, UserUpdate
from crud.user import get_all_users, get_user_by_id, update_user, delete_user
from crud.class_crud import get_all_classes, delete_class
from database import get_session

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=dict)
def get_users(session: Session = Depends(get_session)):
    users = get_all_users(session)
    return {"data": users}

@router.delete("/{user_id}", response_model=dict)
def delete_user_endpoint(user_id: int, session: Session = Depends(get_session)):
    user = get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # If teacher, delete their classes
    if user.type == "teacher":
        classes = get_all_classes(session)
        for class_obj in classes:
            if class_obj.teacher_id == user_id:
                delete_class(session, class_obj.id)
    
    success = delete_user(session, user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not delete user")
    
    return {"data": user_id}

@router.patch("/{user_id}", response_model=dict)
def update_user_endpoint(
    user_id: int, 
    user_update: UserUpdate, 
    session: Session = Depends(get_session)
):
    updated_user = update_user(session, user_id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"data": updated_user}