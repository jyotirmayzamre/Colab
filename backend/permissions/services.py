from documents.models import Document
from accounts.models import User
from uuid import UUID
from .models import ShareLink, DocumentAccess

class ShareLinkService:
    @staticmethod
    def get_or_create_share_link(docId: UUID, role: str) -> 'ShareLink':
        
        link = ShareLink.objects.get_active_link(docId=docId, role=role)
        
        if not link:
            link = ShareLink.objects.create(document_id=docId, role=role)
        
        return link
    

class DocumentAccessService:
    @staticmethod
    def create_or_update_access(docId: UUID, userId: UUID, level: str) -> tuple['DocumentAccess', bool]:
        document = Document.objects.get(pk=docId)
        user = User.objects.get(pk=userId)

        access, created = DocumentAccess.objects.get_or_create(
            document_id=docId,
            user_id=userId,
            defaults={'level': level}
        )

        if not created:
            if access.level == 'owner':
                raise ValueError('Cannot edit access level of an owner')
            access.level = level
            access.save(update_fields=['level'])
        else:
            document.authors.add(user)
        
        return access, created
    
    @staticmethod
    def get_access(document: Document, userId: UUID) -> 'DocumentAccess':
        return DocumentAccess.objects.get(document=document, user_id=userId)
    
    @staticmethod
    def delete_access(docId: UUID, userId: UUID):
        access = DocumentAccess.objects.get(document_id=docId, user_id=userId)
        
        if access.level == 'owner':
            raise ValueError('Cannot delete owner access through this method')
        
        document = Document.objects.get(pk=docId)
        document.authors.remove(userId)
        access.delete()
        return

    @staticmethod
    def get_document_access_except_user(docId: UUID, userId: UUID):
        return DocumentAccess.objects.filter(
            document_id=docId
        ).exclude(
            user_id=userId
        ).exclude(
            level='owner'
        )

    @staticmethod
    def cleanup_access(userId: UUID):
        user = User.objects.get(pk=userId)
        DocumentAccess.objects.cleanup(user)