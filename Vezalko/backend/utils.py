import random
import string

def generate_unique_code(length: int = 8) -> str:
    """Generate a random alphanumeric code of specified length"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))