from rest_framework.views import APIView
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, MyTokenObtainPairSerializer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models.functions import Concat
from django.db.models import Value
from .models import User

'''
Endpoint for registration of users
'''
class RegistrationAPIView(APIView):
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            data = serializer.save()
            return Response(data, status=status.HTTP_201_CREATED) 
        else:
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        


class LoginAPIView(APIView):
    serializer_class = LoginSerializer
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
    

class LogoutAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refreshToken = request.data.get('refresh')
            token = RefreshToken(refreshToken)
            token.blacklist()
            return Response({'message': 'Logout successful'}, status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"message": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)


class MeAPIView(APIView):
    permission_classes = (IsAuthenticated)

    def get(self, request: Request) -> Response:
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer



class SearchUserAPIView(APIView):
    def get(self, request: Request):
        query = request.query_params['q']
        if not query:
            return Response({'results': []})
        
        q = User.objects.annotate(fullname=Concat('first_name', Value(' '), 'last_name'))
        c = q.filter(fullname__icontains=query).exclude(id=request.user.id)[:5]
        serializer = UserSerializer(c, many=True)

        return Response({'results': serializer.data})
