from uuid import UUID
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class UserService:
    @staticmethod
    def update_password(user: User, new_password: str) -> User:
        user.set_password(new_password)
        user.save(update_fields=['password'])
        return user
    
    @staticmethod
    def update_username(user: User, new_username: str) -> User:
        user.username = new_username
        user.save(update_fields=['username'])
        return user
    