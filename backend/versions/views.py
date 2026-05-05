from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError as DRFValidationError

from .models import Version
from .serializers import VersionSerializer, VersionStateSerializer
from .services import VersionService
from permissions.models import Permission


class VersionPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 10


class NotViewerPermission(BasePermission):
    message = "Viewers are not allowed to perform this action."

    def has_permission(self, request, view) -> bool:
        if view.action in ["list", "retrieve", "state"]:
            return True

        document_id = request.query_params.get("document_id")
        if not document_id:
            return False

        permission = Permission.objects.filter(
            document_id=document_id,
            user_id=request.user.id,
        ).first()

        return bool(permission and permission.role != "viewer")


class VersionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, NotViewerPermission]
    pagination_class = VersionPagination

    def get_queryset(self):
        document_id = self.request.query_params.get("document_id")
        return Version.objects.get_document_versions(int(document_id))

    def get_serializer_class(self):
        if self.action == "state":
            return VersionStateSerializer
        return VersionSerializer

    def create(self, request):
        serializer = VersionSerializer(data=request.data)
        if not serializer.is_valid():
            raise DRFValidationError(serializer.errors)

        version = VersionService.create_version(
            title=serializer.validated_data["title"],
            document_id=serializer.validated_data["document"].id,
            state=serializer.validated_data["state"],
            version_vector=serializer.validated_data["version_vector"],
            creator=request.user,
        )

        return Response(VersionSerializer(version).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def state(self, request):
        version = self.get_object()
        serializer = self.get_serializer(version)
        return Response(serializer.data)
