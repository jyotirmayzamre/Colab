from django.db import models
from django.contrib.auth.models import User
import uuid
from django.core.exceptions import ObjectDoesNotExist
import jsonpickle

class DocumentManager(models.Manager):
    '''
    - Add user to list of auhtors
    - Create 'owner' access level for this doc + user
    '''
    def create_document(self, title: str, userId: str) -> 'Document':
        if not title:
            title = 'Untitled Document'
        
        try:
            user = User.objects.get(pk=userId)
        except ObjectDoesNotExist:
            raise ValueError('User with this id does not exist')
        
        doc = self.create(title=title)
        doc.authors.add(user)
        DocumentAccess.objects.create_access(docId=doc.id, userId=userId, level='owner')

        return doc
    

    def delete_document(self, docId: str):
        try:
            document = self.get(pk=docId)
        except self.model.DoesNotExist:
            raise ValueError('Document with this ID does not exist')
        
        document.delete()
        return
        


class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=50)
    authors = models.ManyToManyField(User, related_name='documents')
    state = models.JSONField(default=lambda: jsonpickle.encode(''))

    objects: 'DocumentManager' = DocumentManager()

    def __str__(self) -> str:
        return self.title


class DocumentAccessManager(models.Manager):
    '''
    Anytime an access object is created, the user is added to the document's list of authors
    '''
    def create_access(self, docId: str, userId: str, level: str) -> 'DocumentAccess':
        try:
            document = Document.objects.get(pk=docId)
        except ObjectDoesNotExist:
            raise ValueError('This document does not exist')
        
        try:
            user = User.objects.get(pk=userId)
        except ObjectDoesNotExist:
            raise ValueError('This user does not exist')
        
        if level not in dict(DocumentAccess.ACCESS):
            raise ValueError('Invalid access level label')
        
        if self.filter(document=document, user=user).exists():
            raise ValueError('Access already exists for this user and document')


        
        docAccess = self.create(document_id=docId, user_id=userId, level=level)
        if user not in document.authors.all():
            document.authors.add(user)

        return docAccess
    
    
    def update_access(self, docId: str, userId: str, level: str) -> 'DocumentAccess':
        if level not in dict(DocumentAccess.ACCESS):
            raise ValueError('Invalid access level label')
        
        try:
            access = self.get(document_id=docId, user_id=userId)
        except DocumentAccess.DoesNotExist:
            raise ValueError('No existing access for this particular user and document')
        
        access.level = level
        access.save(update_fields=['level'])
        return access
    

    def delete_access(self, docId: str, userId: str):
        try:
            document = Document.objects.get(pk=docId)
        except ObjectDoesNotExist:
            raise ValueError(f"Document with this id doesn't exist")

        try:
            user = User.objects.get(pk=userId)
        except ObjectDoesNotExist:
            raise ValueError(f"User with this id doesn't exist")
        
        try:
            access = self.get(document=document, user_id=userId)
        except DocumentAccess.DoesNotExist:
            raise ValueError('No existing access for this particular user and document')
        
        if user in document.authors.all():
            document.authors.remove(user)

        access.delete()

        return

    
class DocumentAccess(models.Model):
    ACCESS = [('view', 'View'), ('edit', 'Edit'), ('owner', 'Owner')]
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='access')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access')
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


    
    

    