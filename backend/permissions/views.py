from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import (
    ValidationError as DRFValidationError,
    PermissionDenied as DRFPermissionDenied,
)
from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework.pagination import LimitOffsetPagination

from .models import Permission
from .serializers import (
    PermissionSerializer,
    ShareLinkSerializer,
    ShareLinkAcceptSerializer,
)
from .services import ShareLinkService, PermissionService


class PermissionPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 10


class PermissionViewSet(viewsets.ModelViewSet):
    pagination_class = PermissionPagination
    http_method_names = ["get", "post", "patch", "delete"]
    serializer_class = PermissionSerializer

    def get_queryset(self):
        document_id = self.request.query_params.get("document_id")

        if not document_id:
            return Permission.objects.none()

        return Permission.objects.for_document_except_user(
            document_id=document_id, user_id=self.request.user.id  # type: ignore
        )

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            permission = PermissionService.create_permission(
                document_id=serializer.validated_data["document_id"],
                user_id=serializer.validated_data["user_id"],
                role=serializer.validated_data["role"],
                requester_id=request.user.id,
            )
        except PermissionDenied as e:
            raise DRFPermissionDenied(str(e))
        except ValidationError as e:
            raise DRFValidationError(str(e))

        return Response(
            self.get_serializer(permission).data, status=status.HTTP_201_CREATED
        )

    def partial_update(self, request):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            permission = PermissionService.update_permission(
                document_id=instance.document.id,
                target_user_id=instance.user.id,
                role=serializer.validated_data["role"],
                requester_id=request.user.id,
            )
        except PermissionDenied as e:
            raise DRFPermissionDenied(str(e))
        except ValidationError as e:
            raise DRFValidationError(str(e))

        return Response(self.get_serializer(permission).data, status=status.HTTP_200_OK)


def destroy(self, request):
    instance = self.get_object()

    try:
        PermissionService.delete_permission(
            document_id=instance.document.id,
            target_user_id=instance.user.id,
            requester_id=request.user.id,
        )
    except PermissionDenied as e:
        raise DRFPermissionDenied(str(e))
    except ValidationError as e:
        raise DRFValidationError(str(e))

    return Response(status=status.HTTP_204_NO_CONTENT)


class ShareLinkCreateView(APIView):

    def post(self, request):
        serializer = ShareLinkSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            raise DRFValidationError(serializer.errors)

        try:
            link = ShareLinkService.create_share_link(
                document_id=serializer.validated_data["document_id"],
                role=serializer.validated_data["role"],
                creator_id=request.user.id,
            )
        except PermissionDenied as e:
            raise DRFPermissionDenied(str(e))
        except ValidationError as e:
            raise DRFValidationError(str(e))

        return Response(
            ShareLinkSerializer(link, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ShareLinkAcceptView(APIView):

    def post(self, request):
        serializer = ShareLinkAcceptSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            raise DRFValidationError(serializer.errors)

        try:
            document, role = ShareLinkService.accept_share_link(
                token=serializer.validated_data["token"],
                user_id=request.user.id,
            )
        except ValidationError as e:
            raise DRFValidationError(str(e))

        redirect_url = f'/documents/{document.id}?isEditable={role == "editor"}'
        return Response(redirect_url, status=status.HTTP_200_OK)
