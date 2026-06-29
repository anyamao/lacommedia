from django.urls import path
from .views import (
    RegisterView,
    ProfileView,
    ChangePasswordView,
    LoginView,
    RefreshView,
    LogoutView,
    DeleteAccountView,
)
from rest_framework_simplejwt.views import TokenVerifyView

app_name = "users"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path(
        "profile/change-password/", ChangePasswordView.as_view(), name="change-password"
    ),
    path("profile/delete/", DeleteAccountView.as_view(), name="delete-account"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("verify/", TokenVerifyView.as_view(), name="verify"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
