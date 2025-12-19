from .models import Document
from accounts.models import User
from permissions.services import DocumentAccessService
from uuid import UUID

class DocumentService:
    @staticmethod
    def create_document(userId: UUID, title: str = 'Untitled Document') -> 'Document':
        doc = Document.objects.create_document(title=title)
        DocumentAccessService.create_or_update_access(
            docId=doc.id,
            userId=userId,
            level='owner'
        )
        return doc
    
    @staticmethod
    def delete_document(document: 'Document') -> None:
        document.delete()

    @staticmethod
    def get_document(docId: UUID) -> 'Document':
        return Document.objects.get(pk=docId)
    
    @staticmethod
    def update_document_state(docId: UUID, state):
        return Document.objects.update_state(docId, state)