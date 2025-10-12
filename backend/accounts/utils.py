from django.core.exceptions import ValidationError
from django.core.validators import validate_email as django_validate_email


def validate_email(value: str) -> tuple[bool, str]:
    invalid_message = 'Enter a valid email address'

    if not value:
        return False, invalid_message
    
    try:
        django_validate_email(value)
    except ValidationError:
        return False, invalid_message
    
    return True, ''