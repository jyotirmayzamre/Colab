from .models import Version
from accounts.models import User
from uuid import UUID

class VersionService:
    @staticmethod
    def create_version(title: str, document_id: UUID, state, creator: User,) -> "Version":
        return Version.objects.create(
            title=title,
            document_id=document_id,
            creator=creator,
            creator_username=creator.username,
            state=state,
        )
    
    @staticmethod
    def get_version_state(version_id: int):
        version = Version.objects.get(pk=version_id)
        return version.state, version.document.id
