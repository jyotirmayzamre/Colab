from documents.models import Document
from accounts.models import User
from uuid import UUID
from .models import ShareLink, DocumentAccess

class ShareLinkService:
    @staticmethod
    def get_or_create_share_link(docId: UUID, role: str) -> 'ShareLink':
        document = Document.objects.get(pk=docId)
        
        link = ShareLink.objects.get_active_link(document=document, role=role)
        
        if not link:
            link = ShareLink.objects.create(document=document, role=role)
        
        return link
    

class DocumentAccessService:
    @staticmethod
    def create_or_update_access(docId: UUID, userId: UUID, level: str) -> tuple['DocumentAccess', bool]:
        document = Document.objects.get(pk=docId)
        user = User.objects.get(pk=userId)
        access, created = DocumentAccess.objects.get_or_create_access(
        document=document,
        user=user,
        level=level)

        if not created:
            if access.level == 'owner':
                raise ValueError('Cannot edit access level of an owner')
            access = DocumentAccess.objects.update_access_level(access, level)
        else:
            document.authors.add(user)
        
        return access, created
    
    @staticmethod
    def delete_access(docId: UUID, userId: UUID):
        try:
            document = Document.objects.get(pk=docId)
        except Document.DoesNotExist:
            raise ValueError(f"Document with this id doesn't exist")

        user = User.objects.get(pk=userId)
        
        try:
            access = DocumentAccess.objects.get(document=document, user=user)
        except DocumentAccess.DoesNotExist:
            raise ValueError('No existing access for this particular user and document')
        
        if access.level == 'owner':
            raise ValueError('Cannot delete owner access through this method')
        
        document.authors.remove(user)
        access.delete()
        return

    @staticmethod
    def get_access(document: Document, userId: UUID) -> 'DocumentAccess':
        return DocumentAccess.objects.get(document=document, user_id=userId)


    @staticmethod
    def cleanup_access(userId: UUID):
        user = User.objects.get(pk=userId)
        DocumentAccess.objects.cleanup(user)