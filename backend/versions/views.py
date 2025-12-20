from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from accounts.serializers import CookieJWTAuthentication
from .services import VersionService
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from .serializers import VersionInputSerializer, VersionOutputSerializer

# Create your views here.
class VersionPagination(LimitOffsetPagination):
    default_limit = 5
    max_limit = 5


class VersionViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = [CookieJWTAuthentication]
    pagination_class = VersionPagination

    def get_queryset(self, request: Request):
        docId = request.query_params.get('docId') 
        return VersionService.get_versions(docId=docId)
    
    def create(self, request, *args, **kwargs):
        input_serializer = VersionInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        data = input_serializer.validated_data

        version = VersionService.create_version(
            title=data['title'], #type: ignore
            docId=data['docId'], #type: ignore
            state=data['state'] #type: ignore
        )

        output_serializer = VersionOutputSerializer(version)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)