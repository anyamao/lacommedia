from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User, Friendship
from apps.books.models import Book
from django.core.validators import RegexValidator

username_validator = RegexValidator(
    r"^[a-zA-Z0-9]+$", "Username может содержать только буквы и цифры (латиница)."
)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    avatar_url = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "level",
            "avatar",
            "avatar_url",
            "dark_theme",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_active", "created_at", "updated_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    avatar_url = serializers.ReadOnlyField()
    total_books_read = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    friends_count = serializers.SerializerMethodField()
    relationship = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "avatar",
            "avatar_url",
            "level",
            "total_books_read",
            "created_at",
            "followers_count",
            "following_count",
            "friends_count",
            "relationship",
        ]

    def get_total_books_read(self, obj):
        return obj.total_books_read

    def get_followers_count(self, obj):
        # Только подписчики (НЕ друзья)
        return Friendship.objects.filter(
            following=obj, status=Friendship.Status.FOLLOWING
        ).count()

    def get_following_count(self, obj):
        # Только подписки (НЕ друзья)
        return Friendship.objects.filter(
            follower=obj, status=Friendship.Status.FOLLOWING
        ).count()

    def get_friends_count(self, obj):
        return Friendship.objects.filter(
            follower=obj, status=Friendship.Status.FRIENDS
        ).count()

    def get_relationship(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return {
                "is_following": False,
                "is_follower": False,
                "is_friend": False,
                "can_friend": False,
                "is_self": False,
            }

        return Friendship.get_relationship_status(request.user, obj)


class UserReadBooksSerializer(serializers.ModelSerializer):
    """Сериализатор для прочитанных книг"""

    class Meta:
        model = Book
        fields = ["id", "name", "author", "genre", "year", "cover", "rating"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password]
    )

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Неверный старый пароль")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "password",
            "password2",
            "first_name",
            "last_name",
        ]

    def validate_username(self, value):
        if not value.isalnum():
            raise serializers.ValidationError(
                "Username может содержать только буквы и цифры (латиница)."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Для обновления профиля (PUT/PATCH)"""

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "username",
            "level",
            "avatar",
            "dark_theme",
        ]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["username"] = user.username
        token["level"] = user.level
        token["dark_theme"] = user.dark_theme
        return token

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(
                request=self.context.get("request"), email=email, password=password
            )
            if not user:
                raise serializers.ValidationError(
                    "Неверный email или пароль", code="authorization"
                )
            if not user.is_active:
                raise serializers.ValidationError(
                    "Аккаунт деактивирован", code="authorization"
                )
        else:
            raise serializers.ValidationError(
                "Необходимо указать email и пароль", code="authorization"
            )

        data = super().validate(attrs)
        data["user"] = UserSerializer(user).data

        request = self.context.get("request")
        if request and hasattr(request, "META"):
            ip = request.META.get("REMOTE_ADDR")
            if ip:
                user.last_login_ip = ip
                user.save(update_fields=["last_login_ip"])

        return data
