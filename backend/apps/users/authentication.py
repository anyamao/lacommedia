from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.utils.translation import gettext_lazy as _


class CustomJWTAuthentication(JWTAuthentication):
    """
    Кастомная аутентификация с поддержкой HttpOnly cookies
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                try:
                    validated_token = self.get_validated_token(raw_token)
                    return self.get_user(validated_token), validated_token
                except (InvalidToken, TokenError):
                    pass

        refresh_token = request.COOKIES.get("refresh_token")
        if refresh_token:
            try:
                from rest_framework_simplejwt.tokens import RefreshToken

                token = RefreshToken(refresh_token)
                access_token = token.access_token
                return self.get_user(access_token), access_token
            except (InvalidToken, TokenError):
                pass

        return None

    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
        except KeyError:
            raise InvalidToken(_("Token contained no recognizable user identification"))

        try:
            user = self.user_model.objects.get(id=user_id)
        except self.user_model.DoesNotExist:
            raise InvalidToken(_("User not found"))

        if not user.is_active:
            raise InvalidToken(_("User is inactive"))

        return user
