from typing import Optional
from django.db import models
import uuid
from django.utils import timezone
from datetime import timedelta
from documents.models import Document
from accounts.models import User

def get_expiry_date():
        return timezone.now() + timedelta(days=7)


class ShareLinkManager(models.Manager):
    def get_active_link(self, document: 'Document', role: str) -> Optional['ShareLink']:
        return self.filter(
            document=document,
            role=role,
            expires_at__gt=timezone.now()
        ).first()


class ShareLink(models.Model):
    
    ROLE = [('viewer', 'Viewer'), ('editor', 'Editor')]
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="document")
    role = models.CharField(max_length=10, choices=ROLE)
    token = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    expires_at = models.DateTimeField(default=get_expiry_date)

    objects: 'ShareLinkManager' = ShareLinkManager()



class DocumentAccessManager(models.Manager):
    def get_or_create_access(self, document: 'Document', user: 'User', level: str) -> tuple['DocumentAccess', bool]:
        return self.get_or_create(
            document=document,
            user=user,
            defaults={'level': level}
        )
    
    def update_access_level(self, access: 'DocumentAccess', level: str) -> 'DocumentAccess':
        access.level = level
        access.save(update_fields=['level'])
        return access

    def cleanup(self, user: User):
        DocumentAccess.objects.filter(user=user).delete()


    
class DocumentAccess(models.Model):
    ACCESS = [('viewer', 'Viewer'), ('editor', 'Editor'), ('owner', 'Owner')]
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='document_access')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_access')
    level = models.CharField(max_length=10, choices=ACCESS)

    objects: 'DocumentAccessManager' = DocumentAccessManager()

    def __str__(self):
        return f'{self.user.username} has {self.level} access to {self.document.title}'
    
    class Meta:
        unique_together = ('document', 'user')
