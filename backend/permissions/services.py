from uuid import UUID
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.utils import timezone

from documents.models import Document
from accounts.models import User
from .models import ShareLink, Permission


class PermissionService:

    @staticmethod
    def can_manage_permissions(document_id: UUID, user_id: UUID) -> Permission:
        permission = Permission.objects.get_user_permission(document_id, user_id)
        
        if not permission:
            raise PermissionDenied("You do not have access to this document.")
        
        if not permission.can_manage_permissions():
            raise PermissionDenied(
                "Only owners and editors can manage document permissions."
            )
        
        return permission
    
    @staticmethod
    def check_is_owner(document_id: UUID, user_id: UUID) -> Permission:
        permission = Permission.objects.get_user_permission(document_id, user_id)
        
        if not permission:
            raise PermissionDenied("You do not have access to this document.")
        
        if not permission.is_owner():
            raise PermissionDenied("Only owners can perform this action.")
        
        return permission
    

    @staticmethod
    @transaction.atomic
    def create_permission(document_id: UUID, user_id: UUID, level: str, requester_id: UUID) -> Permission:
        PermissionService.can_manage_permissions(document_id, requester_id)
        
        if level not in ['viewer', 'editor']:
            raise ValidationError("Level must be 'viewer' or 'editor'.")
        
        existing = Permission.objects.get_user_permission(document_id, user_id)
        if existing:
            raise ValidationError("User already has permission for this document.")
        
        document = Document.objects.get(pk=document_id)
        user = User.objects.get(pk=user_id)
        
        permission = Permission.objects.create(
            document=document,
            user=user,
            level=level
        )
        
        return permission
    

    @staticmethod
    @transaction.atomic
    def update_permission(document_id: UUID, target_user_id: UUID, level: str, requester_id: UUID) -> Permission:
        PermissionService.check_is_owner(document_id, requester_id)
        
        if level not in ['viewer', 'editor']:
            raise ValidationError("Level must be 'viewer' or 'editor'.")
        
        permission = Permission.objects.filter(
            document_id=document_id,
            user_id=target_user_id
        ).first()
        
        if not permission:
            raise ValidationError("Permission not found.")
        
        if permission.is_owner():
            raise ValidationError("Cannot modify owner permissions.")
        
        permission.level = level
        permission.save(update_fields=['level', 'updated_at'])
        
        return permission
    

    @staticmethod
    @transaction.atomic
    def delete_permission(document_id: UUID, target_user_id: UUID, requester_id: UUID) -> None:
        PermissionService.check_is_owner(document_id, requester_id)
        
        # Get target permission
        permission = Permission.objects.filter(
            document_id=document_id,
            user_id=target_user_id
        ).first()
        
        if not permission:
            raise ValidationError("Permission not found.")
        
        if permission.is_owner():
            raise ValidationError("Cannot delete owner permissions.")
        
        permission.delete()
        

class ShareLinkService:

    @staticmethod
    @transaction.atomic
    def create_share_link(document_id: UUID, role: str, creator_id: UUID) -> ShareLink:
        PermissionService.can_manage_permissions(document_id, creator_id)
        
        if role not in ['viewer', 'editor']:
            raise ValidationError("Role must be 'viewer' or 'editor'.")
        
        link = ShareLink.objects.get_active_link(document_id=document_id, role=role)
        
        if not link:
            creator = User.objects.get(pk=creator_id)
            link = ShareLink.objects.create(
                document_id=document_id,
                role=role,
                created_by=creator
            )
        
        return link
    
    @staticmethod
    @transaction.atomic
    def accept_share_link(token: UUID, user_id: UUID) -> tuple[Document, str]:
        link = ShareLink.objects.filter(token=token).select_related('document').first()
        
        if not link:
            raise ValidationError("Invalid share link.")
        
        if link.is_expired():
            ShareLink.objects.delete_expired_for_document(link.document.id)
            raise ValidationError("This share link has expired. All expired links have been removed.")
        
        existing = Permission.objects.get_user_permission(link.document.id, user_id)
        
        if existing:
            return link.document, link.role
        
        user = User.objects.get(pk=user_id)
        Permission.objects.create(
            document=link.document,
            user=user,
            level=link.role
        )
        
        return link.document, link.role