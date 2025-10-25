from rest_framework.views import APIView
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, MyTokenObtainPairSerializer, CookieJWTAuthentication
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.db.models.functions import Concat
from django.db.models import Value
from .models import User
from typing import cast
from django.http import JsonResponse

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
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        


class LoginAPIView(APIView):
    serializer_class = LoginSerializer
    permission_classes = (AllowAny,)

    def post(self, request: Request) -> Response:
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        tokens = serializer.validated_data
        tokens = cast(dict, serializer.validated_data)
        access = tokens.get('access')
        refresh = tokens.get('refresh')
        response = Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
        response.set_cookie(
            key='access',
            value=access, #type:ignore
            httponly=True,
            samesite="Lax",
            secure=False,
            max_age=10 * 60
        )
        response.set_cookie(
            key='refresh',
            value=refresh, #type:ignore
            httponly=True,
            samesite='Lax',
            secure=False,
            max_age=7 * 24 * 60 * 60
        )
        return response
    

class LogoutAPIView(APIView):
    permission_classes=(AllowAny,)
    def post(self, request):
        try:
            refreshToken = request.COOKIES.get('refresh')
            token = RefreshToken(refreshToken)
            token.blacklist()
            response = Response({'message': 'Logout successful'}, status=status.HTTP_205_RESET_CONTENT)
            response.delete_cookie('access')
            response.delete_cookie('refresh')
            return response
        except TokenError:
            return Response({"message": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)


class MeAPIView(APIView):
    permission_classes = (IsAuthenticated,)
    authentication_classes=[CookieJWTAuthentication]

    def get(self, request: Request) -> Response:
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RefreshTokenView(TokenRefreshView):
    permission_classes=(AllowAny,)

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh')
        if not refresh_token:
            return JsonResponse({'message': 'No refresh token found'}, status=401)


        serializer = self.get_serializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            return JsonResponse({"message": str(e)}, status=401)
        
        data = serializer.validated_data
        new_access = data.get('access')

        response = JsonResponse({'message': 'Token refreshed'})

        response.set_cookie(
            key='access',
            value=new_access,
            httponly=True,
            samesite="Lax",
            max_age=10 * 60
        )

        return response

class SearchUserAPIView(APIView):
    def get(self, request: Request):
        query = request.query_params['q']
        if not query:
            return Response({'results': []})
        
        q = User.objects.annotate(fullname=Concat('first_name', Value(' '), 'last_name'))
        c = q.filter(fullname__icontains=query).exclude(id=request.user.id)[:5]
        serializer = UserSerializer(c, many=True)

        return Response({'results': serializer.data})
