from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import DocumentAccessInputSerializer, DocumentAccessOutputSerializer, DocumentAccessUpdateSerializer
from .serializers import ShareLinkInputSerializer, ShareLinkOutputSerializer
from .models import DocumentAccess, ShareLink
from accounts.serializers import CookieJWTAuthentication
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from .services import ShareLinkService, DocumentAccessService

# Create your views here.
class DocumentAccessViewSet(viewsets.ModelViewSet):
    permission_classes=(IsAuthenticated,)
    authentication_classes=[CookieJWTAuthentication]

    def get_serializer_class(self):
        if self.action in ('create'):
            return DocumentAccessInputSerializer
        if self.action in ('update', 'partial_update'):
            return DocumentAccessUpdateSerializer
        return DocumentAccessOutputSerializer

    #make this excluding current user and for a given document id
    def get_queryset(self): 
        user = self.request.user
        docId = self.request.query_params.get("docId") #type: ignore

        if self.action in ("destroy", "retrieve", "update", "partial_update"):
            return DocumentAccess.objects.filter(document_id=docId)
        
        return DocumentAccessService.get_document_access_except_user(
            docId=docId, userId=user.id #type: ignore
        )
        

    def create(self, request, *args, **kwargs):
        input_serializer = self.get_serializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        data = input_serializer.validated_data

        access, created = DocumentAccessService.create_or_update_access(
            docId = data['docId'],
            userId=data['userId'],
            level=data['level']
        )

        output_serializer = DocumentAccessOutputSerializer(access)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(output_serializer.data, status=status_code)
        


class CreateShareLinkView(APIView):
    permission_classes=(IsAuthenticated,)
    authentication_classes=[CookieJWTAuthentication]
    serializer_class = ShareLinkInputSerializer

    def post(self, request: Request) -> Response:
        input_serializer = self.serializer_class(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        data = input_serializer.validated_data

        link = ShareLinkService.get_or_create_share_link(
            docId=data['docId'], #type: ignore
            role=data['role'] #type: ignore
        )

        output_serializer = ShareLinkOutputSerializer(link)

        return Response(output_serializer.data, status=status.HTTP_201_CREATED)



class AcceptShareView(APIView):
    permission_classes=(IsAuthenticated,)
    authentication_classes=[CookieJWTAuthentication]

    def post(self, request: Request) -> Response:
        role = request.data['role'] # type: ignore
        token = request.data['token'] # type: ignore

        if not ShareLink.objects.filter(token=token).exists():
            return Response('Invalid share link', status.HTTP_401_UNAUTHORIZED)

        link = ShareLink.objects.get(token=token)
        document = link.document

        DocumentAccessService.create_or_update_access(document.id, request.user.id, role) # type: ignore

        redirect_link = f'/documents/{document.id}?isEditable={role == "editor"}'
        return Response(redirect_link, status.HTTP_200_OK)


