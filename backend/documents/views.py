from rest_framework import viewsets, filters
from rest_framework.pagination import LimitOffsetPagination
from .serializers import DocumentSerializer
from .models import Document
from .services import DocumentService


class DocumentPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 10


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    pagination_class = DocumentPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ["title"]

    def get_queryset(self):
        return Document.objects.for_user_with_metadata(self.request.user)

    def perform_destroy(self, instance):
        DocumentService.delete_document(instance, self.request.user)
