from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.exceptions import PermissionDenied

from .serializers import DocumentInputSerializer, DocumentOutputSerializer
from accounts.serializers import CookieJWTAuthentication
from documents.services import DocumentService
from .models import Document


class DocumentPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 10

class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = [CookieJWTAuthentication]
    pagination_class = DocumentPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']
    
    def get_queryset(self):
        return Document.objects.for_user_with_metadata(self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user_id'] = self.request.user.id #type: ignore
        return context
    
    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return DocumentInputSerializer
        return DocumentOutputSerializer
    
    def perform_create(self, serializer):
        user_id = self.request.user.id # type: ignore
        if user_id is None:
            raise PermissionDenied("User must be authenticated")
        
        document = DocumentService.create_document(
            user_id=user_id, #type: ignore
            title=serializer.validated_data['title']
        )

        serializer.instance = document
        serializer.save()

        
    def perform_update(self, serializer):
        serializer.save()
        
    def perform_destroy(self, instance):
        DocumentService.delete_document(
            document=instance,
            user=self.request.user # type: ignore
        )
    
    