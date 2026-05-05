from django.db import models
from permissions.models import Permission
from django.db.models import Count, OuterRef, Subquery
from accounts.models import User


class DocumentManager(models.Manager):
    def for_user_with_metadata(self, user):
        user_permission = Permission.objects.filter(
            document=OuterRef("pk"), user=user
        ).values("role")[:1]

        return self.filter(permissions__user=user).annotate(
            permission=Subquery(user_permission),
            num_users=Count("permissions__user", distinct=True),
        )


def state():
    return [[]]


def version_vector():
    return {}


class Document(models.Model):
    title = models.CharField(max_length=50)
    users = models.ManyToManyField(User, through="permissions.Permission")
    state = models.JSONField(default=state)
    version_vector = models.JSONField(default=version_vector)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DocumentManager()

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title
