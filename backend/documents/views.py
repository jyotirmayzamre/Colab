from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .serializers import DocumentSerializer, DocumentAccessSerializer
from .models import Document, DocumentAccess
from rest_framework.pagination import LimitOffsetPagination




class DocumentPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 10

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes=(IsAuthenticated,)
    pagination_class = DocumentPagination
    
    def get_queryset(self):
        user = self.request.user
        return (Document.objects
                .filter(authors=user)
                .order_by('-updated_at'))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user_id'] = self.request.user.id #type: ignore
        return context
        
    def perform_destroy(self, instance):
        Document.objects.delete_document(docId=instance.id)


class DocumentAccessViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentAccessSerializer
    permission_classes=(IsAuthenticated,)
    queryset=DocumentAccess.objects.all()

    def perform_create(self, serializer):
        serializer.save()
        