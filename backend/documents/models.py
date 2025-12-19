from django.db import models
from accounts.models import User
import uuid
from uuid import UUID
from typing import Optional

class DocumentManager(models.Manager):
    def create_document(self, title: str = 'Untitled Document') -> 'Document':
            return super().create(title=title)
    
    def get_document(self, docId: UUID) -> Optional['Document']:
        try:
            return self.get(pk=docId)
        except self.model.DoesNotExist:
            return None
    
    def get_user_documents(self, user):
        return Document.objects.filter(authors=user).order_by('-updated_at')
    

def default_state():
    return []

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=50)
    authors = models.ManyToManyField(User, related_name='documents')
    state = models.JSONField(default=default_state)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects: 'DocumentManager' = DocumentManager()

    def __str__(self) -> str:
        return self.title






    



    