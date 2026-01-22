from uuid import UUID
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import PermissionDenied

from .models import Document
from permissions.models import Permission
from accounts.models import User


class DocumentService:
    @staticmethod
    @transaction.atomic
    def create_document(user_id: UUID, title: str) -> Document:
        user = User.objects.get(id=user_id)
        document = Document.objects.create(title=title)
        
        Permission.objects.create(
            document=document,
            user=user,
            level='owner'
        )
        
        return document
    
    @staticmethod
    def get_document(document_id: UUID) -> Document:
        return Document.objects.get(id=document_id)
    
    @staticmethod
    def update_state(document_id: UUID, state) -> int:
        return Document.objects.filter(id=document_id).update(
            state=state, 
            updated_at=timezone.now()
        )
    
    @staticmethod
    @transaction.atomic
    def delete_document(document: Document, user: User) -> None:
        permission = Permission.objects.filter(
            document=document, 
            user=user
        ).first()
        
        if not permission:
            raise PermissionDenied("You do not have permission for this document.")
        
        if permission.level == 'owner':
            document.delete()
        else:
            permission.delete()