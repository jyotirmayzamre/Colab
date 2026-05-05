from .models import Version
from accounts.models import User


class VersionService:
    @staticmethod
    def create_version(
        title: str,
        document_id: int,
        state,
        version_vector,
        creator: User,
    ) -> "Version":
        return Version.objects.create(
            title=title,
            document_id=document_id,
            creator=creator,
            creator_username=creator.username,
            state=state,
            version_vector=version_vector,
        )

    @staticmethod
    def get_version_state(version_id: int):
        version = Version.objects.get(pk=version_id)
        return version.state, version.version_vector, version.document.id
