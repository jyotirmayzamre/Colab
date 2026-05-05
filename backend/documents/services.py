from django.utils import timezone
from django.core.exceptions import PermissionDenied

from .models import Document
from permissions.models import Permission
from accounts.models import User


class DocumentService:
    @staticmethod
    def create_document(user: User, title: str) -> Document:
        document = Document.objects.create(title=title)

        Permission.objects.create(document=document, user=user, role="owner")

        return document

    @staticmethod
    def get_document(document_id: int) -> Document:
        return Document.objects.get(id=document_id)

    @staticmethod
    def update_state(document_id: int, state, version_vector) -> int:
        return Document.objects.filter(id=document_id).update(
            state=state, version_vector=version_vector, updated_at=timezone.now()
        )

    @staticmethod
    def delete_document(document: Document, user: User) -> None:
        permission = Permission.objects.filter(document=document, user=user).first()

        if not permission:
            raise PermissionDenied("You do not have permission for this document.")

        if permission.level == "owner":
            document.delete()
        else:
            permission.delete()
