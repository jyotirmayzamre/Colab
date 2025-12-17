from django.db import models
from accounts.models import User
import uuid
from uuid import UUID
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from datetime import timedelta

class DocumentManager(models.Manager):
    '''
    - Add user to list of auhtors
    - Create 'owner' access level for this doc + user
    '''
    def create_document(self, userId: UUID, title: str='Untitled Document') -> 'Document': 
        doc = super().create(title=title)
        DocumentAccess.objects.create_or_update_access(docId=doc.id, userId=userId, level='owner')

        return doc
    

    def delete_document(self, docId: UUID):
        try:
            document = self.get(pk=docId)
        except self.model.DoesNotExist:
            raise ValueError('Document with this ID does not exist')
        
        document.delete()
        return
        

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


class DocumentAccessManager(models.Manager):
    '''
    Anytime an access object is created, the user is added to the document's list of authors
    '''
    def create_or_update_access(self, docId: UUID, userId: UUID, level: str) -> tuple['DocumentAccess', bool]:
        document = Document.objects.get(pk=docId)
        user = User.objects.get(pk=userId)

        access, created = DocumentAccess.objects.get_or_create(
        document=document,
        user=user,
        defaults={'level': level})

        if not created:
            if access.level == 'owner':
                raise ValueError('Cannot edit access level of an owner')
            access.level = level
            access.save(update_fields=['level'])
        else:
            document.authors.add(user)

        return access, created
       

    def delete_access(self, docId: UUID, userId: UUID):
        try:
            document = Document.objects.get(pk=docId)
        except ObjectDoesNotExist:
            raise ValueError(f"Document with this id doesn't exist")

        user = User.objects.get(pk=userId)
        
        try:
            access = self.get(document=document, user=user)
        except DocumentAccess.DoesNotExist:
            raise ValueError('No existing access for this particular user and document')
        
        if access.level == 'owner':
            raise ValueError('Cannot delete owner access through this method')
        

        document.authors.remove(user)
        access.delete()

        return

    
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



from django.db.models.signals import pre_delete
from django.dispatch import receiver

@receiver(pre_delete, sender=User)
def delete_user(sender, instance, **kwargs):
    Document.authors.through.objects.filter(user_id=instance.id).delete()
    DocumentAccess.objects.filter(user_id=instance.id).delete()


class ShareLinkManager(models.Manager):

    def create_share_link(self, docId: UUID, role: str, expires: int) -> 'ShareLink':
        document = Document.objects.get(pk=docId)
        expires_at = timezone.now() + timedelta(days=expires)
        link = super().create(document=document, role=role, expires_at=expires_at)
        return link


class ShareLink(models.Model):
    ROLE = [('viewer', 'Viewer'), ('editor', 'Editor')]
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="document")
    role = models.CharField(max_length=10, choices=ROLE)
    token = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(blank=True, null=True)

    objects: 'ShareLinkManager' = ShareLinkManager()



    