
from .models import Version
from uuid import UUID

class VersionService:

    @staticmethod
    def create_version(title: str, docId: UUID, state) -> 'Version':
        return Version.objects.create(title=title, docId=docId, state=state)
    
    @staticmethod
    def get_versions(docId):
        return Version.objects.filter(document_id=docId).order_by('updated_at')