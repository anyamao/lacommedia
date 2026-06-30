from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class Content(models.Model):
    """Базовая модель для всего контента (книги, фильмы, картины, музыка)"""

    class ContentType(models.TextChoices):
        BOOK = "book", "Книга"
        MOVIE = "movie", "Фильм"
        PAINTING = "painting", "Картина"
        MUSIC = "music", "Музыка"

    # Тип контента
    content_type = models.CharField(
        max_length=20, choices=ContentType.choices, verbose_name="Тип контента"
    )

    # Базовые поля (общие для всех)
    title = models.CharField(max_length=255, verbose_name="Название")
    description = models.TextField(verbose_name="Описание")
    cover = models.ImageField(
        upload_to="covers/", blank=True, null=True, verbose_name="Обложка/Постер"
    )
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="Рейтинг",
    )
    year = models.PositiveIntegerField(
        verbose_name="Год выпуска",
        validators=[MinValueValidator(1000), MaxValueValidator(timezone.now().year)],
        null=True,
        blank=True,
    )
    genre = models.CharField(max_length=100, verbose_name="Жанр")
    country = models.CharField(max_length=100, blank=True, verbose_name="Страна")

    # Поля для взаимодействия
    views_count = models.PositiveIntegerField(default=0, verbose_name="Просмотры")
    hours_to_read = models.PositiveIntegerField(
        default=0, verbose_name="Часов на изучение/просмотр"
    )

    # Текстовые поля
    brief_summary = models.TextField(blank=True, verbose_name="Краткий пересказ/сюжет")
    review = models.TextField(blank=True, verbose_name="Рецензия")
    ideas = models.TextField(blank=True, verbose_name="Идеи из произведения")

    # Интересные факты
    interesting_facts = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Интересные факты",
        help_text="Массив объектов {title: 'Заголовок', fact: 'Текст факта'}",
    )

    # Специфичные поля (будут использоваться в зависимости от content_type)
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Дополнительные данные",
        help_text="Специфичные поля для разных типов контента",
    )

    # Системные поля
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "content_content"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content_type"]),
            models.Index(fields=["title"]),
            models.Index(fields=["genre"]),
            models.Index(fields=["country"]),
        ]
        verbose_name = "Контент"
        verbose_name_plural = "Контент"

    def __str__(self):
        return f"{self.get_content_type_display()}: {self.title}"

    @property
    def cover_url(self):
        if self.cover:
            return self.cover.url
        return None

    @property
    def short_description(self):
        if self.description:
            if len(self.description) > 100:
                return self.description[:97] + "..."
            return self.description
        return ""

    @property
    def is_book(self):
        return self.content_type == self.ContentType.BOOK

    @property
    def is_movie(self):
        return self.content_type == self.ContentType.MOVIE

    @property
    def is_painting(self):
        return self.content_type == self.ContentType.PAINTING

    @property
    def is_music(self):
        return self.content_type == self.ContentType.MUSIC

    def update_average_rating(self):
        """Обновить средний рейтинг отзывов"""
        from django.db.models import Avg

        avg = self.reviews.filter(is_active=True).aggregate(Avg("rating"))[
            "rating__avg"
        ]
        self.rating = avg if avg else 0.0
        self.save(update_fields=["rating"])

    def get_extra_field(self, key, default=None):
        """Получить значение из extra_data"""
        return self.extra_data.get(key, default)

    def set_extra_field(self, key, value):
        """Установить значение в extra_data"""
        self.extra_data[key] = value
        self.save(update_fields=["extra_data"])


class Character(models.Model):
    """Герои/персонажи (для книг и фильмов)"""

    content = models.ForeignKey(
        Content,
        on_delete=models.CASCADE,
        related_name="characters",
        verbose_name="Контент",
    )
    image = models.ImageField(
        upload_to="characters/", blank=True, null=True, verbose_name="Фото/Портрет"
    )
    first_name = models.CharField(max_length=100, verbose_name="Имя")
    last_name = models.CharField(max_length=100, blank=True, verbose_name="Фамилия")
    about = models.TextField(blank=True, verbose_name="О персонаже")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "content_character"
        ordering = ["first_name"]
        verbose_name = "Персонаж"
        verbose_name_plural = "Персонажи"

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


class Review(models.Model):
    """Отзывы на контент"""

    content = models.ForeignKey(
        Content,
        on_delete=models.CASCADE,
        related_name="reviews",
        verbose_name="Контент",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="content_reviews",
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
        db_table = "content_review"
        unique_together = ["content", "user"]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["content", "user"]),
            models.Index(fields=["rating"]),
        ]
        verbose_name = "Отзыв"
        verbose_name_plural = "Отзывы"

    def toggle_reaction(self, user, reaction_type):
        """Переключить лайк/дизлайк на отзыве"""
        from .models import ReviewReaction  # ✅ Импорт внутри метода

        existing = ReviewReaction.objects.filter(review=self, user=user).first()

        if existing:
            if existing.reaction_type == reaction_type:
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
        return f"{self.user.username} - {self.content.title} ({self.rating}/10)"


class ReviewReaction(models.Model):
    """Лайк/дизлайк отзыва"""

    class ReactionType(models.TextChoices):
        LIKE = "like", "Лайк"
        DISLIKE = "dislike", "Дизлайк"

    review = models.ForeignKey(
        Review, on_delete=models.CASCADE, related_name="reactions", verbose_name="Отзыв"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="content_review_reactions",  # ✅ УНИКАЛЬНОЕ ИМЯ
        verbose_name="Пользователь",
    )
    reaction_type = models.CharField(
        max_length=10, choices=ReactionType.choices, verbose_name="Тип реакции"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "content_review_reaction"
        unique_together = ["review", "user"]
        indexes = [
            models.Index(fields=["review", "user"]),
        ]
        verbose_name = "Реакция на отзыв"
        verbose_name_plural = "Реакции на отзывы"

    def __str__(self):
        return f"{self.user.username} - {self.reaction_type} - {self.review.id}"


class QuizQuestion(models.Model):
    """Вопросы для теста по контенту"""

    content = models.ForeignKey(
        Content,
        on_delete=models.CASCADE,
        related_name="quiz_questions",
        verbose_name="Контент",
    )
    question = models.TextField(verbose_name="Вопрос")
    options = models.JSONField(
        default=list,
        verbose_name="Варианты ответов",
        help_text="Массив строк с вариантами ответов",
    )
    correct_answer = models.PositiveSmallIntegerField(
        verbose_name="Правильный ответ (индекс в options)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "content_quiz_question"
        ordering = ["id"]
        verbose_name = "Вопрос теста"
        verbose_name_plural = "Вопросы теста"

    def __str__(self):
        return f"{self.content.title} - Вопрос {self.id}"
