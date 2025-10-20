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
    site_id = models.PositiveSmallIntegerField(unique=True, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.site_id is None:
            last_site_id = User.objects.aggregate(models.Max('site_id'))['site_id__max'] or 0
            self.site_id = last_site_id + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

