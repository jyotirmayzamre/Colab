
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from accounts.models import User
from .models import Document
from permissions.services import DocumentAccessService

@receiver(pre_delete, sender=User)
def cleanup_user_document_access(sender, instance, **kwargs):
    Document.authors.through.objects.filter(user_id=instance.id).delete()
    DocumentAccessService.cleanup_access(instance.id)