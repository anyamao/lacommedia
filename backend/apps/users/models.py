from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import RegexValidator
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

username_validator = RegexValidator(
    r"^[a-zA-Z0-9]+$", "Username может содержать только буквы и цифры (латиница)."
)


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email обязателен")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, verbose_name="Email")
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[username_validator],
        verbose_name="Username",
    )
    books_read_count = models.PositiveIntegerField(
        default=0, verbose_name="Прочитано книг"
    )
    first_name = models.CharField(max_length=150, blank=True, verbose_name="Имя")
    last_name = models.CharField(max_length=150, blank=True, verbose_name="Фамилия")
    level = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="Уровень",
    )
    avatar = models.ImageField(
        upload_to="avatars/", blank=True, null=True, verbose_name="Аватар"
    )
    dark_theme = models.BooleanField(default=False, verbose_name="Темная тема")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users_user"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["username"]),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return None

    @property
    def total_books_read(self):
        """Общее количество прочитанных книг"""
        from apps.books.models import Book
        from django.contrib.contenttypes.models import ContentType
        from apps.interactions.models import Interaction

        content_type = ContentType.objects.get_for_model(Book)
        return Interaction.objects.filter(
            user=self, content_type=content_type, interaction_type="read"
        ).count()


# Добавляем в конец файла


class Friendship(models.Model):
    """
    Модель для подписок и друзей
    """

    class Status(models.TextChoices):
        FOLLOWING = "following", "Подписан"
        FRIENDS = "friends", "Друзья"
        BLOCKED = "blocked", "Заблокирован"

    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="following",
        verbose_name="Подписчик",
    )
    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="followers",
        verbose_name="Подписан",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.FOLLOWING,
        verbose_name="Статус",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users_friendship"
        unique_together = ["follower", "following"]
        indexes = [
            models.Index(fields=["follower", "following"]),
            models.Index(fields=["status"]),
        ]
        verbose_name = "Подписка"
        verbose_name_plural = "Подписки"

    def __str__(self):
        return f"{self.follower.username} -> {self.following.username} ({self.status})"

    @classmethod
    def toggle_follow(cls, follower, following):
        """Переключить подписку"""
        if follower == following:
            return {"error": "Нельзя подписаться на себя"}

        friendship, created = cls.objects.get_or_create(
            follower=follower,
            following=following,
            defaults={"status": cls.Status.FOLLOWING},
        )

        if not created:
            friendship.delete()
            return {"action": "unfollowed"}

        # Проверяем, есть ли обратная подписка
        reverse_friendship = cls.objects.filter(
            follower=following, following=follower, status=cls.Status.FOLLOWING
        ).first()

        if reverse_friendship:
            # Становимся друзьями
            friendship.status = cls.Status.FRIENDS
            friendship.save()
            reverse_friendship.status = cls.Status.FRIENDS
            reverse_friendship.save()
            return {"action": "friends"}

        return {"action": "followed"}

    @classmethod
    def get_user_stats(cls, user):
        """Получить статистику пользователя"""
        return {
            # ✅ Подписчики — только те, кто подписан, но НЕ друзья
            "followers": cls.objects.filter(
                following=user,
                status=cls.Status.FOLLOWING,  # ✅ ТОЛЬКО FOLLOWING
            ).count(),
            # ✅ Подписки — только те, на кого подписан, но НЕ друзья
            "following": cls.objects.filter(
                follower=user,
                status=cls.Status.FOLLOWING,  # ✅ ТОЛЬКО FOLLOWING
            ).count(),
            # ✅ Друзья — отдельно
            "friends": cls.objects.filter(
                follower=user, status=cls.Status.FRIENDS
            ).count(),
        }

    @classmethod
    def get_user_books_read(cls, user):
        """Получить прочитанные книги пользователя"""
        from apps.books.models import Book
        from django.contrib.contenttypes.models import ContentType
        from apps.interactions.models import Interaction

        content_type = ContentType.objects.get_for_model(Book)
        book_ids = Interaction.objects.filter(
            user=user, content_type=content_type, interaction_type="read"
        ).values_list("object_id", flat=True)

        return Book.objects.filter(id__in=book_ids, is_active=True)
