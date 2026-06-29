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
    CustomTokenObtainPairSerializer,
)

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
