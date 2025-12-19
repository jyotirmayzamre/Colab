from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .serializers import DocumentInputSerializer, DocumentOutputSerializer
from .models import Document
from rest_framework.pagination import LimitOffsetPagination
from accounts.serializers import CookieJWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from documents.services import DocumentService


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
        user = self.request.user
        return Document.objects.get_user_documents(user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user 
        context['user_id'] = user.id #type: ignore
        return context
    
    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return DocumentInputSerializer
        return DocumentOutputSerializer
    
    def _upsert_access(self, request, status_code=status.HTTP_200_OK):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        if self.action == 'create':
            document = DocumentService.create_document(
                userId=request.user.id,
                title=data['title']
            )
        else:  
            document = self.get_object()
            for key, value in data.items():
                setattr(document, key, value)
            document.save()

        output_serializer = DocumentOutputSerializer(
            document, 
            context=self.get_serializer_context()
        )
        return Response(output_serializer.data, status=status_code)
    
    def create(self, request, *args, **kwargs):
        return self._upsert_access(request, status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        return self._upsert_access(request)
    
    def partial_update(self, request, *args, **kwargs):
        return self._upsert_access(request)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        DocumentService.delete_document(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)