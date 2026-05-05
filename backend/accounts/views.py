from .serializers import (
    RegisterSerializer,
    UserSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer,
    UsernameChangeSerializer,
)

from .models import User

from rest_framework.generics import (
    CreateAPIView,
    RetrieveAPIView,
    UpdateAPIView,
    ListAPIView,
)
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from rest_framework.response import Response

from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework.exceptions import ValidationError
from rest_framework.pagination import LimitOffsetPagination


class RegistrationView(CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class LoginView(TokenObtainPairView):
    permission_classes = (AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            response.set_cookie(
                key="access",
                value=response.data["access"],
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=10 * 60,
            )

            response.set_cookie(
                key="refresh",
                value=response.data["refresh"],
                httponly=True,
                samesite="Lax",
                secure=False,
                max_age=30 * 60,
            )

            response.data = {"detail": "Login successful"}
        return response


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        response = Response({"detail": "Logged out."}, status=204)
        response.delete_cookie("access")
        response.delete_cookie("refresh")
        return response


class MeView(RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ProfileView(RetrieveAPIView):
    serializer_class = UserProfileSerializer

    def get_object(self):
        return User.objects.get_user_profile(self.request.user.id)


class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh")

        if not refresh_token:
            return Response({"detail": "Refresh token missing."}, status=400)

        serializer = self.get_serializer(data={"refresh": refresh_token})
        serializer.is_valid(raise_exception=True)

        response = Response({"detail": "Token refreshed."})
        response.set_cookie(
            key="access",
            value=serializer.validated_data["access"],
            httponly=True,
            samesite="Lax",
            max_age=10 * 60,
            secure=False,
        )
        return response


class UserPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 10


class SearchUserView(ListAPIView):
    serializer_class = UserSerializer
    pagination_class = UserPagination

    def get_queryset(self):
        query = self.request.query_params.get("q", "")
        document_id = self.request.query_params.get("document_id")

        if not document_id:
            raise ValidationError("Document id not passed.")
        if not query:
            return User.objects.none()

        return User.objects.search_for_users(
            query=query,
            user_id=self.request.user.id,
        )


class PasswordChangeView(UpdateAPIView):
    serializer_class = PasswordChangeSerializer
    http_method_names = ["patch"]  # or patch if you prefer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return Response({"detail": "Password updated."})


class UsernameChangeView(UpdateAPIView):
    serializer_class = UsernameChangeSerializer
    http_method_names = ["patch"]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return Response({"detail": "Username updated."})
