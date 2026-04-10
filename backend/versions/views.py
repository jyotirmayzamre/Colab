from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from accounts.serializers import CookieJWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from .serializers import VersionInputSerializer, VersionOutputSerializer, VersionStateSerializer
from .models import Version
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from .services import VersionService
from uuid import UUID
from permissions.models import Permission


class VersionPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 10

class NotViewerPermission(BasePermission):
    message = "Viewers are not allowed to perform this action."

    def has_permission(self, request, view):
        user = request.user
        if view.action in ['list', 'retrieve', 'state']:
            return True

        document_id = request.query_params.get('document_id')
        if not document_id:
            return False

        return self.check_permission(document_id, user.id)

    def check_permission(self, document_id: UUID, user_id: UUID) -> bool:
        permission = Permission.objects.filter(document_id=document_id, user_id=user_id).first()
        if not permission:
            return False
        return permission.level != 'viewer'


class VersionViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, NotViewerPermission,)
    authentication_classes = [CookieJWTAuthentication]
    pagination_class = VersionPagination


    def get_queryset(self):
        document_id = self.request.query_params.get('document_id')  #type: ignore
        return Version.objects.get_document_versions(document_id)
        
    
    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return VersionInputSerializer
        if self.action == 'state':
            return VersionStateSerializer
        return VersionOutputSerializer
    
    def create(self, request):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        version = VersionService.create_version(
            title=data['title'], 
            document_id=data['document'].id, 
            state=data['state'],
            version_vector=data['version_vector'],
            creator=request.user
        )

        output_serializer = VersionOutputSerializer(version)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    

    @action(detail=True, methods=['get'])
    def state(self):
        version = self.get_object()
        serializer = self.get_serializer(version)
        return Response(serializer.data)
