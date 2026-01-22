from django.urls import path
from .views import RegistrationAPIView, LoginAPIView, LogoutAPIView, MyTokenObtainPairView, SearchUserAPIView, MeAPIView, RefreshTokenView
from .views import UserProfileAPIView, UpdatePasswordAPIView, UpdateUsernameAPIView

urlpatterns = [
    path('signup/', RegistrationAPIView.as_view(), name='signup'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('me/', MeAPIView.as_view(), name='me'),
    path('profile/', UserProfileAPIView.as_view(), name='profile'),
    path('token/', MyTokenObtainPairView.as_view(), name='token'),
    path('token/refresh/', RefreshTokenView.as_view(), name='refresh_token'),
    path('searchUsers/', SearchUserAPIView.as_view(), name='search_users'),
    path('update-password/', UpdatePasswordAPIView.as_view(), name='update_password'),
    path('update-username/', UpdateUsernameAPIView.as_view(), name='update_username'),
]