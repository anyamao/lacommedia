from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Character(models.Model):
    """Модель для главных героев книги"""

    book = models.ForeignKey(
        "Book",
        on_delete=models.CASCADE,
        related_name="characters",
        verbose_name="Книга",
    )
    image = models.ImageField(
        upload_to="characters/", blank=True, null=True, verbose_name="Фото героя"
    )
    first_name = models.CharField(max_length=100, verbose_name="Имя")
    last_name = models.CharField(max_length=100, blank=True, verbose_name="Фамилия")
    about = models.TextField(blank=True, verbose_name="О герое")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "books_character"
        ordering = ["first_name"]
        verbose_name = "Герой"
        verbose_name_plural = "Герои"

    def __str__(self):
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

    @property
    def full_name(self):
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None


class Book(models.Model):
    # Основные поля
    name = models.CharField(max_length=255, verbose_name="Название")
    author = models.CharField(max_length=255, verbose_name="Автор")
    country = models.CharField(max_length=100, blank=True, verbose_name="Страна")
    genre = models.CharField(max_length=100, verbose_name="Жанр")
    year = models.PositiveIntegerField(
        verbose_name="Год издания",
        validators=[MinValueValidator(1000), MaxValueValidator(timezone.now().year)],
    )
    average_rating = models.DecimalField(
        max_digits=3, decimal_places=1, default=0.0, verbose_name="Средний рейтинг"
    )
    description = models.TextField(verbose_name="Описание")
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="Рейтинг",
    )
    cover = models.ImageField(
        upload_to="covers/", blank=True, null=True, verbose_name="Обложка"
    )
    ideas = models.TextField(
        blank=True,
        verbose_name="Идеи из книги",
        help_text="Что можно вынести из этой книги (опционально)",
    )
    review = models.TextField(blank=True, verbose_name="Рецензия")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    views_count = models.PositiveIntegerField(default=0, verbose_name="Просмотры")

    # Новые поля
    hours_to_read = models.PositiveIntegerField(
        default=0,
        verbose_name="Часов на чтение",
        help_text="Примерное количество часов на чтение книги",
    )
    brief_summary = models.TextField(
        blank=True,
        verbose_name="Краткий пересказ сюжета",
        help_text="Краткое содержание книги (опционально)",
    )

    class Meta:
        db_table = "books_book"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["author"]),
            models.Index(fields=["genre"]),
            models.Index(fields=["country"]),
        ]
        verbose_name = "Книга"
        verbose_name_plural = "Книги"

    def __str__(self):
        return f"{self.name} - {self.author}"

    def update_average_rating(self):
        """Обновить средний рейтинг отзывов"""
        from django.db.models import Avg

        avg = self.reviews.filter(is_active=True).aggregate(Avg("rating"))[
            "rating__avg"
        ]
        self.average_rating = avg if avg else 0.0
        self.save(update_fields=["average_rating"])

    @property
    def short_description(self):
        """Первые 100 символов описания"""
        if self.description:
            if len(self.description) > 100:
                return self.description[:97] + "..."
            return self.description
        return ""


class Review(models.Model):
    """Отзыв на книгу"""

    book = models.ForeignKey(
        "Book", on_delete=models.CASCADE, related_name="reviews", verbose_name="Книга"
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="book_reviews",
        verbose_name="Пользователь",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        verbose_name="Оценка (1-10)",
    )
    text = models.TextField(verbose_name="Текст отзыва")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "books_review"
        unique_together = ["book", "user"]  # ✅ Один отзыв от пользователя на книгу
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["book", "user"]),
            models.Index(fields=["rating"]),
        ]
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"

    def toggle_reaction(self, user, reaction_type):
        """Переключить лайк/дизлайк на отзыве"""
        from .models import ReviewReaction

        existing = ReviewReaction.objects.filter(review=self, user=user).first()

        if existing:
            if existing.reaction_type == reaction_type:
                # Удаляем реакцию (отмена)
                existing.delete()
                likes_count = self.reactions.filter(reaction_type="like").count()
                dislikes_count = self.reactions.filter(reaction_type="dislike").count()
                return {
                    "action": "removed",
                    "likes_count": likes_count,
                    "dislikes_count": dislikes_count,
                    "user_reaction": None,
                }
            else:
                # Меняем реакцию
                existing.reaction_type = reaction_type
                existing.save()
                likes_count = self.reactions.filter(reaction_type="like").count()
                dislikes_count = self.reactions.filter(reaction_type="dislike").count()
                return {
                    "action": "changed",
                    "likes_count": likes_count,
                    "dislikes_count": dislikes_count,
                    "user_reaction": reaction_type,
                }
        else:
            # Создаем новую реакцию
            ReviewReaction.objects.create(
                review=self, user=user, reaction_type=reaction_type
            )
            likes_count = self.reactions.filter(reaction_type="like").count()
            dislikes_count = self.reactions.filter(reaction_type="dislike").count()
            return {
                "action": "added",
                "likes_count": likes_count,
                "dislikes_count": dislikes_count,
                "user_reaction": reaction_type,
            }

    def __str__(self):
        return f"{self.user.username} - {self.book.name} ({self.rating}/10)"


class ReviewReaction(models.Model):
    """Лайк/дизлайк отзыва"""

    class ReactionType(models.TextChoices):
        LIKE = "like", "Лайк"
        DISLIKE = "dislike", "Дизлайк"

    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name="reactions",  # ✅ Убедитесь, что это поле есть!
        verbose_name="Отзыв",
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="review_reactions",
        verbose_name="Пользователь",
    )
    reaction_type = models.CharField(
        max_length=10, choices=ReactionType.choices, verbose_name="Тип реакции"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "books_review_reaction"
        unique_together = ["review", "user"]
        indexes = [
            models.Index(fields=["review", "user"]),
        ]
        verbose_name = "Реакция на отзыв"
        verbose_name_plural = "Реакции на отзывы"

    def __str__(self):
        return f"{self.user.username} - {self.reaction_type} - {self.review.id}"
