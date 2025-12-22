from .models import Version

class VersionService:
    @staticmethod
    def get_version_state(versionId: int):
        version = Version.objects.get(pk=versionId)
        return version.state, version.document.id
