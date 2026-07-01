from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.auth import get_user_model
import uuid
import os

User = get_user_model()


def get_upload_path(instance, filename):
    """Генерирует путь для загрузки файлов"""
    # Определяем тип контента
    content_type = (
        instance.content_type if hasattr(instance, "content_type") else "content"
    )

    # Получаем ID объекта
    obj_id = instance.id or 0

    # Получаем расширение файла
    ext = filename.split(".")[-1].lower()

    # Генерируем уникальное имя
    unique_filename = f"{uuid.uuid4().hex[:10]}.{ext}"

    # Возвращаем путь
    return f"{content_type}s/{obj_id}/{unique_filename}"


class Content(models.Model):
    """Базовая модель для всего контента"""

    class ContentType(models.TextChoices):
        BOOK = "book", "Книга"
        MOVIE = "movie", "Фильм"
        PAINTING = "painting", "Картина"
        MUSIC = "music", "Музыка"
        ARTICLE = "article", "Статья"
        COURSE = "course", "Курс"

    content_type = models.CharField(
        max_length=20, choices=ContentType.choices, verbose_name="Тип контента"
    )
    title = models.CharField(max_length=255, verbose_name="Название")
    description = models.TextField(verbose_name="Описание")

    cover = models.ImageField(
        upload_to=get_upload_path,  # ✅ Используем динамическую функцию
        blank=True,
        null=True,
        verbose_name="Обложка/Постер",
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
    views_count = models.PositiveIntegerField(default=0, verbose_name="Просмотры")
    hours_to_read = models.PositiveIntegerField(
        default=0, verbose_name="Часов на изучение/просмотр"
    )
    brief_summary = models.TextField(blank=True, verbose_name="Краткий пересказ/сюжет")
    review = models.TextField(blank=True, verbose_name="Рецензия")
    ideas = models.TextField(blank=True, verbose_name="Идеи из произведения")
    interesting_facts = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Интересные факты",
        help_text="Массив объектов {title: 'Заголовок', fact: 'Текст факта'}",
    )
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Дополнительные данные",
        help_text="Специфичные поля для разных типов контента",
    )
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

    def update_average_rating(self):
        from django.db.models import Avg

        avg = self.reviews.filter(is_active=True).aggregate(Avg("rating"))[
            "rating__avg"
        ]
        self.rating = avg if avg else 0.0
        self.save(update_fields=["rating"])

    def get_extra_field(self, key, default=None):
        return self.extra_data.get(key, default)

    def set_extra_field(self, key, value):
        self.extra_data[key] = value
        self.save(update_fields=["extra_data"])


class Character(models.Model):
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

    def __str__(self):
        return f"{self.user.username} - {self.content.title} ({self.rating}/10)"

    def toggle_reaction(self, user, reaction_type):
        from .models import ReviewReaction

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


class ReviewReaction(models.Model):
    class ReactionType(models.TextChoices):
        LIKE = "like", "Лайк"
        DISLIKE = "dislike", "Дизлайк"

    review = models.ForeignKey(
        Review, on_delete=models.CASCADE, related_name="reactions", verbose_name="Отзыв"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="content_review_reactions",
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


class Person(models.Model):
    class Occupation(models.TextChoices):
        WRITER = "writer", "Писатель"
        DIRECTOR = "director", "Режиссёр"
        ARTIST = "artist", "Художник"
        COMPOSER = "composer", "Композитор"
        ACTOR = "actor", "Актёр"
        OTHER = "other", "Другое"

    first_name = models.CharField(max_length=100, verbose_name="Имя")
    last_name = models.CharField(max_length=100, blank=True, verbose_name="Фамилия")
    image = models.ImageField(
        upload_to="people/", blank=True, null=True, verbose_name="Фото"
    )
    date_of_birth = models.DateField(
        null=True, blank=True, verbose_name="Дата рождения"
    )
    date_of_death = models.DateField(null=True, blank=True, verbose_name="Дата смерти")
    birth_country = models.CharField(
        max_length=100, blank=True, verbose_name="Страна рождения"
    )
    occupation = models.CharField(
        max_length=20, choices=Occupation.choices, verbose_name="Профессия"
    )
    biography = models.TextField(blank=True, verbose_name="Биография")
    interesting_facts = models.JSONField(
        default=list, blank=True, verbose_name="Интересные факты"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "content_person"
        ordering = ["last_name", "first_name"]
        indexes = [
            models.Index(fields=["last_name", "first_name"]),
            models.Index(fields=["occupation"]),
        ]
        verbose_name = "Человек"
        verbose_name_plural = "Люди"

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

    @property
    def is_alive(self):
        return self.date_of_death is None


# ============ КУРСЫ ============


class Course(models.Model):
    """Курс"""

    title = models.CharField(max_length=255, verbose_name="Название")
    description = models.TextField(verbose_name="Описание")
    cover = models.ImageField(
        upload_to="courses/", blank=True, null=True, verbose_name="Обложка"
    )
    topic = models.CharField(max_length=100, verbose_name="Тема")
    authors = models.JSONField(
        default=list, verbose_name="Авторы", help_text="Массив строк с именами авторов"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "content_course"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["topic"]),
            models.Index(fields=["title"]),
        ]
        verbose_name = "Курс"
        verbose_name_plural = "Курсы"

    def __str__(self):
        return self.title

    @property
    def cover_url(self):
        if self.cover:
            return self.cover.url
        return None

    @property
    def total_time(self):
        return sum(lesson.duration for lesson in self.lessons.filter(is_active=True))

    @property
    def lessons_count(self):
        return self.lessons.filter(is_active=True).count()


class Lesson(models.Model):
    """Урок в курсе"""

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="lessons", verbose_name="Курс"
    )
    title = models.CharField(max_length=255, verbose_name="Название урока")
    content = models.TextField(verbose_name="Содержание урока")
    duration = models.PositiveIntegerField(
        default=5, verbose_name="Длительность (в минутах)"
    )
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "content_lesson"
        ordering = ["order", "created_at"]
        indexes = [
            models.Index(fields=["course", "order"]),
        ]
        verbose_name = "Урок"
        verbose_name_plural = "Уроки"

    def __str__(self):
        return f"{self.course.title} - {self.title}"


class LessonQuizQuestion(models.Model):
    """Вопросы для теста урока"""

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="quiz_questions",
        verbose_name="Урок",
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
        db_table = "content_lesson_quiz_question"
        ordering = ["id"]
        verbose_name = "Вопрос теста урока"
        verbose_name_plural = "Вопросы теста урока"

    def __str__(self):
        return f"{self.lesson.title} - Вопрос {self.id}"


# ============ ПРОГРЕСС ============


class CourseProgress(models.Model):
    """Прогресс пользователя по курсу"""

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="progresses", verbose_name="Курс"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="course_progresses",
        verbose_name="Пользователь",
    )
    is_completed = models.BooleanField(default=False, verbose_name="Курс пройден")
    completed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Дата прохождения"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "content_course_progress"
        unique_together = ["course", "user"]
        verbose_name = "Прогресс курса"
        verbose_name_plural = "Прогрессы курсов"

    def __str__(self):
        return f"{self.user.username} - {self.course.title} ({'Пройден' if self.is_completed else 'В процессе'})"


class LessonProgress(models.Model):
    """Прогресс пользователя по уроку"""

    lesson = models.ForeignKey(
        Lesson, on_delete=models.CASCADE, related_name="progresses", verbose_name="Урок"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="lesson_progresses",
        verbose_name="Пользователь",
    )
    is_completed = models.BooleanField(default=False, verbose_name="Урок пройден")
    score = models.PositiveSmallIntegerField(
        default=0, verbose_name="Процент правильных ответов"
    )
    completed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Дата прохождения"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "content_lesson_progress"
        unique_together = ["lesson", "user"]
        verbose_name = "Прогресс урока"
        verbose_name_plural = "Прогрессы уроков"

    def __str__(self):
        return f"{self.user.username} - {self.lesson.title} ({self.score}%)"
