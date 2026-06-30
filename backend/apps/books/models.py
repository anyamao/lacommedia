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

    @property
    def short_description(self):
        """Первые 100 символов описания"""
        if self.description:
            if len(self.description) > 100:
                return self.description[:97] + "..."
            return self.description
        return ""
