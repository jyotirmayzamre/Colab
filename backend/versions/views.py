from rest_framework import viewsets
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from accounts.serializers import CookieJWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from .serializers import VersionInputSerializer, VersionOutputSerializer, VersionStateSerializer
from .models import Version
from rest_framework.decorators import action

# Create your views here.
class VersionPagination(LimitOffsetPagination):
    default_limit = 5
    max_limit = 5


class VersionViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    authentication_classes = [CookieJWTAuthentication]
    pagination_class = VersionPagination


    def get_queryset(self):
        qs = Version.objects.all().order_by('-created_at')
        docId = self.request.query_params.get('docId')  #type: ignore
        if docId:
            qs = qs.filter(document_id=docId)
        return qs
    
    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return VersionInputSerializer
        if self.action == 'state':
            return VersionStateSerializer
        return VersionOutputSerializer
    
    def create(self, request, *args, **kwargs):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        data = input_serializer.validated_data

        version = Version.objects.create_version(
            title=data['title'], 
            docId=data['document'].id, 
            state=data['state'], 
            creator=request.user
        )

        output_serializer = VersionOutputSerializer(version)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    

    @action(detail=True, methods=['get'])
    def state(self, request, pk=None):
        version = self.get_object()
        serializer = self.get_serializer(version)
        return Response(serializer.data)