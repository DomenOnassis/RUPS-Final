from sqlmodel import Session, select
from models.story import Story
from schemas.story import StoryCreate, StoryUpdate
from typing import Optional, List

def create_story(session: Session, story_in: StoryCreate) -> Story:
    story = Story(
        title=story_in.title,
        author=story_in.author,
        short_description=story_in.short_description,
        content=story_in.content,
        is_finished=False
    )
    session.add(story)
    session.commit()
    session.refresh(story)
    return story

def get_story_by_id(session: Session, story_id: int) -> Optional[Story]:
    return session.get(Story, story_id)

def get_all_stories(session: Session) -> List[Story]:
    statement = select(Story)
    return list(session.exec(statement).all())

def update_story(session: Session, story_id: int, story_update: StoryUpdate) -> Optional[Story]:
    story = session.get(Story, story_id)
    if not story:
        return None
    
    update_data = story_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(story, key, value)
    
    session.add(story)
    session.commit()
    session.refresh(story)
    return story

def delete_story(session: Session, story_id: int) -> bool:
    story = session.get(Story, story_id)
    if not story:
        return False
    
    session.delete(story)
    session.commit()
    return True