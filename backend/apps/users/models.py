from django.core.validators import RegexValidator
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

# Валидатор для username (только буквы и цифры)
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
        help_text="Только буквы и цифры (латиница)",
    )

    # Профиль
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
    books_read_count = models.PositiveIntegerField(
        default=0, verbose_name="Прочитано книг"
    )

    # Системные поля
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


class Friendship(models.Model):
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

        # Проверяем, есть ли существующая подписка
        friendship = cls.objects.filter(follower=follower, following=following).first()

        if friendship:
            # Если есть — удаляем (отписка)
            friendship.delete()

            # Проверяем, были ли мы друзьями
            # Если была взаимная подписка со статусом FRIENDS — удаляем и её
            reverse_friendship = cls.objects.filter(
                follower=following, following=follower, status=cls.Status.FRIENDS
            ).first()
            if reverse_friendship:
                reverse_friendship.delete()

            return {"action": "unfollowed"}

        # Нет подписки — создаем
        friendship = cls.objects.create(
            follower=follower, following=following, status=cls.Status.FOLLOWING
        )

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
    def unfriend(cls, user, target_user):
        """Удалить из друзей (удаляет подписку user → target_user и меняет статус обратной)"""
        if user == target_user:
            return {"error": "Нельзя удалить себя из друзей"}

        # 1. Удаляем подписку user → target_user (если она есть)
        friendship = cls.objects.filter(
            follower=user, following=target_user, status=cls.Status.FRIENDS
        ).first()

        if friendship:
            friendship.delete()
        else:
            # Если нет прямой подписки со статусом FRIENDS, проверяем FOLLOWING
            friendship = cls.objects.filter(
                follower=user, following=target_user, status=cls.Status.FOLLOWING
            ).first()
            if friendship:
                friendship.delete()

        # 2. Находим обратную подписку target_user → user
        reverse_friendship = cls.objects.filter(
            follower=target_user, following=user
        ).first()

        if reverse_friendship:
            # Если она была со статусом FRIENDS — меняем на FOLLOWING
            if reverse_friendship.status == cls.Status.FRIENDS:
                reverse_friendship.status = cls.Status.FOLLOWING
                reverse_friendship.save()
        # Если была FOLLOWING — оставляем как есть (она уже FOLLOWING)
        # Если была BLOCKED — оставляем

        return {"action": "unfriended"}

    @classmethod
    def get_relationship_status(cls, user, target_user):
        """
        Получить статус отношений между user и target_user
        Возвращает: {
            'is_following': bool,  # user подписан на target_user
            'is_follower': bool,   # target_user подписан на user
            'is_friend': bool,     # они друзья
            'can_friend': bool,    # можно добавить в друзья (target_user подписан на user)
        }
        """
        if user == target_user:
            return {
                "is_following": False,
                "is_follower": False,
                "is_friend": False,
                "can_friend": False,
                "is_self": True,
            }

        # Подписка user → target_user
        user_follows = cls.objects.filter(
            follower=user,
            following=target_user,
            status__in=[cls.Status.FOLLOWING, cls.Status.FRIENDS],
        ).exists()

        # Подписка target_user → user
        target_follows = cls.objects.filter(
            follower=target_user,
            following=user,
            status__in=[cls.Status.FOLLOWING, cls.Status.FRIENDS],
        ).exists()

        # Друзья (взаимная подписка со статусом FRIENDS)
        are_friends = (
            cls.objects.filter(
                follower=user, following=target_user, status=cls.Status.FRIENDS
            ).exists()
            and cls.objects.filter(
                follower=target_user, following=user, status=cls.Status.FRIENDS
            ).exists()
        )

        # Можно добавить в друзья (target_user уже подписан на user, но они не друзья)
        can_friend = target_follows and not are_friends

        return {
            "is_following": user_follows,
            "is_follower": target_follows,
            "is_friend": are_friends,
            "can_friend": can_friend,
            "is_self": False,
        }

    @classmethod
    def add_friend(cls, user, target_user):
        """Добавить в друзья (если target_user уже подписан на user)"""
        if user == target_user:
            return {"error": "Нельзя добавить себя в друзья"}

        # Проверяем, что target_user подписан на user (статус FOLLOWING или FRIENDS)
        target_follows = cls.objects.filter(
            follower=target_user, following=user
        ).first()

        if not target_follows:
            return {"error": "Этот пользователь не подписан на вас"}

        # Если уже друзья — ничего не делаем
        if target_follows.status == cls.Status.FRIENDS:
            # Проверяем, есть ли обратная подписка со статусом FRIENDS
            user_follows = cls.objects.filter(
                follower=user, following=target_user, status=cls.Status.FRIENDS
            ).first()
            if user_follows:
                return {"error": "Вы уже друзья"}

        # Проверяем, есть ли уже подписка user → target_user
        user_follows = cls.objects.filter(follower=user, following=target_user).first()

        if user_follows:
            # Если есть — обновляем статус на FRIENDS
            user_follows.status = cls.Status.FRIENDS
            user_follows.save()
        else:
            # Создаем подписку со статусом FRIENDS
            user_follows = cls.objects.create(
                follower=user, following=target_user, status=cls.Status.FRIENDS
            )

        # Обновляем подписку target_user → user на FRIENDS
        target_follows.status = cls.Status.FRIENDS
        target_follows.save()

        return {"action": "friended"}

    @classmethod
    def get_user_stats(cls, user):
        """Получить статистику пользователя"""
        return {
            "followers": cls.objects.filter(
                following=user, status=cls.Status.FOLLOWING
            ).count(),
            "following": cls.objects.filter(
                follower=user, status=cls.Status.FOLLOWING
            ).count(),
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
