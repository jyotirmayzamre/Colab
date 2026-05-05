import uuid
from datetime import timedelta
from typing import Optional

from django.db import models
from django.utils import timezone


def default_expiry():
    return timezone.now() + timedelta(days=7)


class ShareLinkManager(models.Manager):
    def get_active(self, document_id: int, role: str) -> Optional["ShareLink"]:
        return self.filter(
            document_id=document_id,
            role=role,
            expires_at__gt=timezone.now(),
        ).first()

    def delete_expired(self, document_id: int) -> int:
        count, _ = self.filter(
            document_id=document_id,
            expires_at__lte=timezone.now(),
        ).delete()
        return count


class ShareLink(models.Model):
    ROLE_CHOICES = [
        ("viewer", "Viewer"),
        ("editor", "Editor"),
    ]

    token = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    document = models.ForeignKey(
        "documents.Document",
        on_delete=models.CASCADE,
        related_name="share_links",
    )

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
    )

    expires_at = models.DateTimeField(default=default_expiry)

    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_share_links",
    )

    objects = ShareLinkManager()

    class Meta:
        ordering = ["-expires_at"]

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"{self.document} ({self.role})"


class PermissionManager(models.Manager):
    def for_document_except_user(self, document_id: int, user_id: int):
        return (
            self.filter(document_id=document_id)
            .exclude(user_id=user_id)
            .select_related("user")
        )


class Permission(models.Model):
    ROLE_CHOICES = [
        ("viewer", "Viewer"),
        ("editor", "Editor"),
        ("owner", "Owner"),
    ]

    document = models.ForeignKey(
        "documents.Document",
        on_delete=models.CASCADE,
        related_name="permissions",
    )

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="document_permissions",
    )

    role = models.CharField(choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects: PermissionManager = PermissionManager()

    class Meta:
        unique_together = ("document", "user")
        indexes = [
            models.Index(fields=["document", "user"]),
        ]

    def __str__(self):
        return f"{self.user} → {self.role} → {self.document}"

    def is_owner(self) -> bool:
        return self.role == "owner"

    def can_edit(self) -> bool:
        return self.role in ("owner", "editor")

    def can_view(self) -> bool:
        return self.role in ("owner", "editor", "viewer")
