# Import all models here to ensure they're registered with SQLModel
from models.user import User
from models.story import Story
from models.paragraph import Paragraph
from models.class_model import Class, ClassStudent, ClassStory

__all__ = [
    "User",
    "Story", 
    "Paragraph",
    "Class",
    "ClassStudent",
    "ClassStory"
]