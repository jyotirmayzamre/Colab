from django.db import models
from documents.models import Document
from uuid import UUID

# Create your models here.
def default_state():
    return []

class VersionManager(models.Manager):
    def create(self, title: str, docId: UUID, state) -> 'Version':
        return Version.objects.create(
            title=title,
            document_id=docId,
            state=state
        )
    
   


class Version(models.Model):
    title = models.CharField(max_length=50)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    state = models.JSONField(default=default_state)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
