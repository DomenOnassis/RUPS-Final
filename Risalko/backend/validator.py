def validate_required_fields(data, required_fields):
    if not data:
        return False, 'No data provided'
    
    missing = [field for field in required_fields if not data.get(field)]
    if missing:
        return False, f'Missing required fields: {", ".join(missing)}'
    
    return True, None