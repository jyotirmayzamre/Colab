from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.contrib.auth.models import UserManager
from rest_framework_simplejwt.tokens import RefreshToken


class User(AbstractUser):
    objects: UserManager = UserManager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)


    def __str__(self):
        return self.username

