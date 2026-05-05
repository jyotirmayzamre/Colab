from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as AbstractUserManager
from django.db.models import Value
from django.db.models.functions import Concat
from django.db.models import Count, Q


class UserManager(AbstractUserManager):

    def search_for_users(self, query: str, user_id: int):
        return (
            self.annotate(fullname=Concat("first_name", Value(" "), "last_name"))
            .filter(fullname__icontains=query)
            .exclude(id=user_id)
        )

    def get_user_profile(self, user_id: int):
        return (
            self.filter(id=user_id)
            .annotate(
                documents_owned=Count(
                    "document_permissions__document",
                    filter=Q(document_permissions__role="owner"),
                    distinct=True,
                ),
                documents_shared=Count(
                    "document_permissions__document",
                    filter=Q(document_permissions__role__in=["viewer", "editor"]),
                    distinct=True,
                ),
            )
            .first()
        )


class User(AbstractUser):
    objects: UserManager = UserManager()

    class Meta:
        indexes = [models.Index(fields=["first_name", "last_name"])]

    def __str__(self):
        return self.username
