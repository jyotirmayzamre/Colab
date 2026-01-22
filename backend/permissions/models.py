from typing import Optional
from django.db import models
import uuid
from uuid import UUID
from django.utils import timezone
from datetime import timedelta

def get_expiry_date():
        return timezone.now() + timedelta(days=7)


class ShareLinkManager(models.Manager):
    def get_active_link(self, document_id: UUID, role: str) -> Optional['ShareLink']:
        return self.filter(
            document_id=document_id,
            role=role,
            expires_at__gt=timezone.now()
        ).first()
    
    def delete_expired_for_document(self, document_id: uuid.UUID) -> int:
        count, _ = self.filter(
            document_id=document_id,
            expires_at__lte=timezone.now()
        ).delete()
        return count


class ShareLink(models.Model):
    
    ROLE = [('viewer', 'Viewer'), ('editor', 'Editor')]
    document = models.ForeignKey('documents.Document', on_delete=models.CASCADE, related_name="share_links")
    role = models.CharField(max_length=10, choices=ROLE)
    token = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    expires_at = models.DateTimeField(default=get_expiry_date)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_share_links'
    )
    objects: 'ShareLinkManager' = ShareLinkManager()

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at



class PermissionManager(models.Manager):
    def for_document_except_user(self, document_id: UUID, user_id: UUID):
        return self.filter(
            document_id=document_id
        ).exclude(
            user_id=user_id
        ).select_related('user')
    
    def get_user_permission(self, document_id: UUID, user_id: UUID) -> Optional['Permission']:
        return self.filter(document_id=document_id, user_id=user_id).first()
    

class Permission(models.Model):
    PERMISSION_CHOICES = [('viewer', 'Viewer'), ('editor', 'Editor'), ('owner', 'Owner')]
    document = models.ForeignKey('documents.Document', on_delete=models.CASCADE, related_name='permissions')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='user_access')
    level = models.CharField(max_length=10, choices=PERMISSION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    objects: 'PermissionManager' = PermissionManager()

    def __str__(self):
        return f'{self.user.username} has {self.level} access to {self.document.title}'
    
    def is_owner(self) -> bool:
        return self.level == 'owner'
    
    def can_manage_permissions(self) -> bool:
        return self.level in ['owner', 'editor']

    class Meta:
        unique_together = ('document', 'user')
        indexes = [
            models.Index(fields=['document', 'user'])
        ]
