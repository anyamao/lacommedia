from django.urls import path
from .views import (
    RegisterView,
    ProfileView,
    ChangePasswordView,
    LoginView,
    RefreshView,
    LogoutView,
    DeleteAccountView,
    PublicProfileView,
    UserReadBooksView,
    FollowToggleView,
    FollowersListView,
    FollowingListView,
    AddFriendView,
    UnfriendView,  # ✅ Добавляем
    FriendsListView,
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
    path("profile/<str:username>/", PublicProfileView.as_view(), name="public_profile"),
    path(
        "profile/<str:username>/books/", UserReadBooksView.as_view(), name="user_books"
    ),
    path("follow/toggle/", FollowToggleView.as_view(), name="follow_toggle"),
    path("friend/add/", AddFriendView.as_view(), name="add_friend"),
    path("friend/remove/", UnfriendView.as_view(), name="unfriend"),
    path(
        "profile/<str:username>/followers/",
        FollowersListView.as_view(),
        name="followers",
    ),
    path(
        "profile/<str:username>/following/",
        FollowingListView.as_view(),
        name="following",
    ),
    path("profile/<str:username>/friends/", FriendsListView.as_view(), name="friends"),
    # Подписки
    path("follow/toggle/", FollowToggleView.as_view(), name="follow_toggle"),
]
