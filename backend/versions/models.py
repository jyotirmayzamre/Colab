from django.db import models
from documents.models import Document
from accounts.models import User


def state():
    return [[]]


def version_vector():
    return {}


class VersionManager(models.Manager):
    def get_document_versions(self, document_id: int):
        return Version.objects.filter(document_id=document_id)


class Version(models.Model):
    title = models.CharField(max_length=50)
    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name="versions"
    )
    state = models.JSONField(default=state)
    version_vector = models.JSONField(default=version_vector)
    creator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="created_versions",
        null=True,
        blank=True,
    )
    creator_username = models.CharField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects: "VersionManager" = VersionManager()

    class Meta:
        ordering = ["-created_at"]
