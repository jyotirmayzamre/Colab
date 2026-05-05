from django.urls import path
from .views import (
    RegistrationView,
    LoginView,
    LogoutView,
    MeView,
    ProfileView,
    CustomTokenRefreshView,
    SearchUserView,
    PasswordChangeView,
    UsernameChangeView,
)

urlpatterns = [
    path("register/", RegistrationView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="refresh_token"),
    path("search/", SearchUserView.as_view(), name="search_users"),
    path("update-password/", PasswordChangeView.as_view(), name="update_password"),
    path("update-username/", UsernameChangeView.as_view(), name="update_username"),
]

