from rest_framework import viewsets, filters
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import DocumentInputSerializer, DocumentOutputSerializer, DocumentAccessInputSerializer, DocumentAccessOutputSerializer
from .serializers import ShareLinkInputSerializer, ShareLinkOutputSerializer
from .models import Document, DocumentAccess, ShareLink
from rest_framework.pagination import LimitOffsetPagination
from accounts.serializers import CookieJWTAuthentication
from rest_framework.response import Response
from rest_framework.request import Request
import rest_framework.status as status


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
        return (Document.objects
                .filter(authors=user)
                .order_by('-updated_at'))

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
            document = Document.objects.create_document(
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
        
    def perform_destroy(self, instance):
        Document.objects.delete_document(docId=instance.id)


class DocumentAccessViewSet(viewsets.ModelViewSet):
    permission_classes=(IsAuthenticated,)
    authentication_classes=[CookieJWTAuthentication]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return DocumentAccessInputSerializer
        return DocumentAccessOutputSerializer

    def get_queryset(self):
        return (DocumentAccess.objects.filter(user=self.request.user))
    
    def _upsert_access(self, request, status_code=status.HTTP_200_OK):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        data = input_serializer.validated_data

        access = DocumentAccess.objects.create_or_update_access(
            docId=data['document'],
            userId=data['user'],
            level=data['level']
        )

        output_serializer = DocumentAccessOutputSerializer(access)

        return Response(output_serializer.data, status=status_code)

    def create(self, request, *args, **kwargs):
        return self._upsert_access(request, status.HTTP_201_CREATED)
        
    def update(self, request, *args, **kwargs):
        return self._upsert_access(request)


class CreateShareLink(APIView):
    permission_classes=(IsAuthenticated,)
    serializer_class = ShareLinkInputSerializer

    def post(self, request: Request) -> Response:
        input_serializer = self.serializer_class(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        data = input_serializer.validated_data

        link = ShareLink.objects.create_share_link(
            docId=data['docId'], # type: ignore
            role=data['role'], # type: ignore
            expires=data['expires'] #type: ignore
        )

        output_serializer = ShareLinkOutputSerializer(link)

        return Response(output_serializer.data, status=status.HTTP_201_CREATED)



    