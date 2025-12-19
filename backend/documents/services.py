from .models import Document
from accounts.models import User
from permissions.services import DocumentAccessService
from uuid import UUID

class DocumentService:
    @staticmethod
    def create_document(userId: UUID, title: str = 'Untitled Document') -> 'Document':
        doc = Document.objects.create_document(title=title)
        user = User.objects.get(pk=userId)
        DocumentAccessService.create_or_update_access(
            document=doc,
            user=user,
            level='owner'
        )
        return doc
    
    @staticmethod
    def delete_document(document: 'Document') -> None:
        document.delete()