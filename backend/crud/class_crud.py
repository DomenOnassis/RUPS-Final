from sqlmodel import Session, select
from models.class_model import Class, ClassStudent, ClassStory
from models.user import User
from models.story import Story
from schemas.class_schema import ClassCreate, ClassUpdate
from typing import Optional, List
import json

def create_class(session: Session, class_in: ClassCreate) -> Class:
    new_class = Class(
        class_name=class_in.class_name,
        teacher_id=class_in.teacher,
        color=class_in.color
    )
    session.add(new_class)
    session.commit()
    session.refresh(new_class)
    
    # Add students
    for student_id in class_in.students:
        class_student = ClassStudent(class_id=new_class.id, student_id=student_id)
        session.add(class_student)
    
    # Add stories
    for story_id in class_in.stories:
        class_story = ClassStory(class_id=new_class.id, story_id=story_id)
        session.add(class_story)
    
    session.commit()
    session.refresh(new_class)
    return new_class

def get_class_by_id(session: Session, class_id: int, populate: bool = False) -> Optional[Class]:
    class_obj = session.get(Class, class_id)
    if not class_obj:
        return None
    
    if populate:
        # SQLModel relationships will auto-populate
        session.refresh(class_obj)
    
    return class_obj

def get_all_classes(session: Session, populate: bool = False) -> List[Class]:
    statement = select(Class)
    classes = list(session.exec(statement).all())
    
    if populate:
        for class_obj in classes:
            session.refresh(class_obj)
    
    return classes

def update_class(session: Session, class_id: int, class_update: ClassUpdate) -> Optional[Class]:
    class_obj = session.get(Class, class_id)
    if not class_obj:
        return None
    
    update_data = class_update.model_dump(exclude_unset=True)
    
    # Handle students update
    if "students" in update_data:
        # Delete existing students
        statement = select(ClassStudent).where(ClassStudent.class_id == class_id)
        existing = session.exec(statement).all()
        for cs in existing:
            session.delete(cs)
        
        # Add new students
        for student_id in update_data["students"]:
            class_student = ClassStudent(class_id=class_id, student_id=student_id)
            session.add(class_student)
        
        del update_data["students"]
    
    # Handle stories update
    if "stories" in update_data:
        # Delete existing stories
        statement = select(ClassStory).where(ClassStory.class_id == class_id)
        existing = session.exec(statement).all()
        for cs in existing:
            session.delete(cs)
        
        # Add new stories
        for story_id in update_data["stories"]:
            class_story = ClassStory(class_id=class_id, story_id=story_id)
            session.add(class_story)
        
        del update_data["stories"]
    
    # Update remaining fields
    for key, value in update_data.items():
        setattr(class_obj, key, value)
    
    session.add(class_obj)
    session.commit()
    session.refresh(class_obj)
    return class_obj

def delete_class(session: Session, class_id: int) -> bool:
    class_obj = session.get(Class, class_id)
    if not class_obj:
        return False
    
    session.delete(class_obj)
    session.commit()
    return True

def remove_student_from_class(session: Session, class_id: int, student_id: int) -> bool:
    statement = select(ClassStudent).where(
        ClassStudent.class_id == class_id,
        ClassStudent.student_id == student_id
    )
    class_student = session.exec(statement).first()
    
    if not class_student:
        return False
    
    session.delete(class_student)
    session.commit()
    return True

def add_finalized_story(session: Session, class_id: int, story_data: dict) -> Optional[Class]:
    class_obj = session.get(Class, class_id)
    if not class_obj:
        return None
    
    # Parse existing finalized_stories
    finalized = []
    if class_obj.finalized_stories:
        try:
            finalized = json.loads(class_obj.finalized_stories)
        except:
            finalized = []
    
    finalized.append(story_data)
    class_obj.finalized_stories = json.dumps(finalized)
    
    session.add(class_obj)
    session.commit()
    session.refresh(class_obj)
    return class_obj

def remove_story_from_class(session: Session, class_id: int, story_id: int) -> bool:
    statement = select(ClassStory).where(
        ClassStory.class_id == class_id,
        ClassStory.story_id == story_id
    )
    class_story = session.exec(statement).first()
    
    if not class_story:
        return False
    
    session.delete(class_story)
    session.commit()
    return True