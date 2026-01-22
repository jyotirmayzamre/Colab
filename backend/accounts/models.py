from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.contrib.auth.models import BaseUserManager
from django.db.models import Value
from django.db.models.functions import Concat
from permissions.models import Permission
from django.db.models import Count, Q
from uuid import UUID

class UserManager(BaseUserManager):

    def create_user(
        self,
        email,
        password=None,
        first_name=None,
        last_name=None,
        username=None,
        **extra_fields
    ):
        email = self.normalize_email(email)

        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            username=username,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(email=email, password=password, **extra_fields)



    def search_for_users(self, query: str, document_id: UUID, exclude_user_id: UUID):
        return (
            self.annotate(
                fullname=Concat('first_name', Value(' '), 'last_name')
            )
            .filter(fullname__icontains=query)
            .exclude(id=exclude_user_id)
            .exclude(
                id__in=Permission.objects.filter(
                    document_id=document_id
                ).values_list('user_id', flat=True)
            )
        )
    
    def get_user_profile(self, user_id: UUID):
        return (
            User.objects
            .filter(id=user_id)
            .annotate(
                documents_owned=Count(
                    'user_access__document',
                    filter=Q(user_access__level='owner'),
                    distinct=True
                ),
                documents_shared=Count(
                    'user_access__document',
                    filter=Q(user_access__level__in=['viewer', 'editor']),
                    distinct=True
                )
            )
            .first()
        )


class User(AbstractUser):
    objects: UserManager = UserManager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    site_id = models.PositiveSmallIntegerField(unique=True, null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['first_name', 'last_name'])
        ]

    def save(self, *args, **kwargs):
        if self.site_id is None:
            last_site_id = User.objects.aggregate(models.Max('site_id'))['site_id__max'] or 0
            self.site_id = last_site_id + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
    
    objects = UserManager()

