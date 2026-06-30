from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    RegisterSerializer,
    UserProfileSerializer,  # ✅ Добавляем
    UserReadBooksSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
)
from django.shortcuts import get_object_or_404
from .models import User, Friendship

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя"""

    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    """Получение и обновление профиля"""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(views.APIView):
    """Смена пароля"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"detail": "Пароль успешно изменен"}, status=status.HTTP_200_OK)


class LoginView(TokenObtainPairView):
    """
    Логин с установкой refresh токена в HttpOnly cookie
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access_token = serializer.validated_data["access"]
        refresh_token = serializer.validated_data["refresh"]
        user_data = serializer.validated_data.get("user", None)

        response = Response(
            {
                "access": access_token,
                "user": user_data,
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=7 * 24 * 60 * 60,
            secure=False,
            httponly=True,
            samesite="Lax",
            path="/api/v1/auth/",
        )

        return response


class RefreshView(views.APIView):
    """
    Обновление access токена через refresh cookie
    """

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found in cookies"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            from rest_framework_simplejwt.tokens import RefreshToken

            token = RefreshToken(refresh_token)
            access_token = str(token.access_token)

            new_refresh_token = str(token)

            response = Response(
                {
                    "access": access_token,
                },
                status=status.HTTP_200_OK,
            )

            response.set_cookie(
                key="refresh_token",
                value=new_refresh_token,
                max_age=7 * 24 * 60 * 60,
                secure=False,
                httponly=True,
                samesite="Lax",
                path="/api/v1/auth/",
            )

            return response

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(views.APIView):
    """
    Выход — удаляем refresh cookie
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response = Response({"detail": "Успешный выход"}, status=status.HTTP_200_OK)

        response.delete_cookie(
            key="refresh_token",
            path="/api/v1/auth/",
        )

        return response


class DeleteAccountView(views.APIView):
    """Удаление аккаунта"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.is_active = False
        user.save()

        response = Response(
            {"detail": "Аккаунт деактивирован"}, status=status.HTTP_204_NO_CONTENT
        )

        response.delete_cookie(
            key="refresh_token",
            path="/api/v1/auth/",
        )

        return response


class PublicProfileView(generics.RetrieveAPIView):
    """Публичный профиль пользователя"""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "username"
    lookup_url_kwarg = "username"

    def get_queryset(self):
        return User.objects.filter(is_active=True)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class UserReadBooksView(generics.ListAPIView):
    """Список прочитанных книг пользователя"""

    serializer_class = UserReadBooksSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        username = self.kwargs.get("username")
        user = get_object_or_404(User, username=username, is_active=True)
        return Friendship.get_user_books_read(user)


class FollowToggleView(views.APIView):
    """Переключить подписку"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        username = request.data.get("username")
        if not username:
            return Response(
                {"error": "username required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Правильный поиск пользователя
        try:
            target_user = User.objects.get(username=username, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        if target_user == request.user:
            return Response(
                {"error": "Нельзя подписаться на себя"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = Friendship.toggle_follow(request.user, target_user)

        return Response(
            {
                "action": result.get("action", "followed"),
                "followers_count": Friendship.objects.filter(
                    following=target_user,
                    status__in=[Friendship.Status.FOLLOWING, Friendship.Status.FRIENDS],
                ).count(),
            }
        )


class FollowersListView(generics.ListAPIView):
    """Список подписчиков пользователя (только НЕ друзья)"""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        username = self.kwargs.get("username")
        user = get_object_or_404(User, username=username, is_active=True)
        # ✅ Только подписчики, которые НЕ друзья
        return User.objects.filter(
            following__following=user,
            following__status=Friendship.Status.FOLLOWING,  # ✅ ТОЛЬКО FOLLOWING
        )


class FollowingListView(generics.ListAPIView):
    """Список подписок пользователя (только НЕ друзья)"""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        username = self.kwargs.get("username")
        user = get_object_or_404(User, username=username, is_active=True)
        # ✅ Только подписки, которые НЕ друзья
        return User.objects.filter(
            followers__follower=user,
            followers__status=Friendship.Status.FOLLOWING,  # ✅ ТОЛЬКО FOLLOWING
        )


class FriendsListView(generics.ListAPIView):
    """Список друзей пользователя"""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        username = self.kwargs.get("username")
        user = get_object_or_404(User, username=username, is_active=True)
        return User.objects.filter(
            followers__follower=user, followers__status=Friendship.Status.FRIENDS
        )
