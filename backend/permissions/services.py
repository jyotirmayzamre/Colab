from typing import cast
from uuid import UUID
from django.core.exceptions import ValidationError, PermissionDenied

from documents.models import Document
from .models import ShareLink, Permission

VALID_ROLES = {"viewer", "editor"}


class PermissionService:
    @staticmethod
    def _get_permission(document_id: int, user_id: int) -> Permission:
        try:
            return Permission.objects.get(
                document_id=document_id,
                user_id=user_id,
            )
        except Permission.DoesNotExist:
            raise PermissionDenied("You do not have access to this document.")

    @staticmethod
    def _validate_role(role: str):
        if role not in VALID_ROLES:
            raise ValidationError("Role must be 'viewer' or 'editor'.")

    @staticmethod
    def can_manage_permissions(document_id: int, user_id: int) -> Permission:
        permission = PermissionService._get_permission(document_id, user_id)

        if not permission.can_edit():
            raise PermissionDenied(
                "Only owners and editors can manage document permissions."
            )

        return permission

    @staticmethod
    def require_owner(document_id: int, user_id: int) -> Permission:
        permission = PermissionService._get_permission(document_id, user_id)

        if not permission.is_owner():
            raise PermissionDenied("Only owners can perform this action.")

        return permission

    @staticmethod
    def create_permission(
        document_id: int,
        user_id: int,
        role: str,
        requester_id: int,
    ) -> Permission:
        PermissionService.can_manage_permissions(document_id, requester_id)
        PermissionService._validate_role(role)

        permission, _ = Permission.objects.get_or_create(
            document_id=document_id,
            user_id=user_id,
            defaults={"role": role},
        )

        return permission

    @staticmethod
    def update_permission(
        document_id: int,
        target_user_id: int,
        role: str,
        requester_id: int,
    ) -> Permission:
        PermissionService.require_owner(document_id, requester_id)
        PermissionService._validate_role(role)
        permission = PermissionService._get_permission(document_id, target_user_id)

        if permission.is_owner():
            raise ValidationError("Cannot modify owner permissions.")

        permission.role = role
        permission.save(update_fields=["role", "updated_at"])

        return permission

    @staticmethod
    def delete_permission(
        document_id: int,
        target_user_id: int,
        requester_id: int,
    ) -> None:
        PermissionService.require_owner(document_id, requester_id)
        permission = PermissionService._get_permission(document_id, target_user_id)

        if permission.is_owner():
            raise ValidationError("Cannot delete owner permissions.")

        permission.delete()


class ShareLinkService:

    @staticmethod
    def _validate_role(role: str):
        if role not in VALID_ROLES:
            raise ValidationError("Role must be 'viewer' or 'editor'.")

    @staticmethod
    def _get_valid_link(token: UUID) -> ShareLink:
        link = ShareLink.objects.select_related("document").filter(token=token).first()

        if not link:
            raise ValidationError("Invalid share link.")

        if link.is_expired():
            ShareLink.objects.delete_expired(link.document_id)
            raise ValidationError("This share link has expired.")

        return link

    @staticmethod
    def create_share_link(
        document_id: int,
        role: str,
        creator_id: int,
    ) -> ShareLink:
        PermissionService.can_manage_permissions(document_id, creator_id)
        ShareLinkService._validate_role(role)

        link = ShareLink.objects.get_active(
            document_id=document_id,
            role=role,
        )

        if link:
            return link

        return ShareLink.objects.create(
            document_id=document_id,
            role=role,
            created_by_id=creator_id,
        )

    @staticmethod
    def accept_share_link(
        token: UUID,
        user_id: int,
    ) -> tuple[Document, str]:

        link = ShareLinkService._get_valid_link(token)
        document = cast(Document, link.document)
        try:
            permission = Permission.objects.get(
                document_id=link.document_id,
                user_id=user_id,
            )
            return document, permission.role

        except Permission.DoesNotExist:
            Permission.objects.create(
                document_id=link.document_id,
                user_id=user_id,
                role=link.role,
            )

        return document, link.role
