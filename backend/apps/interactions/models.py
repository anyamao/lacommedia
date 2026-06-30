from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Interaction(models.Model):
    """
    Универсальная модель для взаимодействий с любым контентом
    """

    class InteractionType(models.TextChoices):
        LIKE = "like", "Лайк"
        DISLIKE = "dislike", "Дизлайк"
        FAVORITE = "favorite", "В избранное"
        READ = "read", "Прочитано"
        VIEW = "view", "Просмотр"

    # Generic relation
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, verbose_name="Тип контента"
    )
    object_id = models.PositiveIntegerField(verbose_name="ID объекта")
    content_object = GenericForeignKey("content_type", "object_id")

    # Пользователь
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="interactions",
        verbose_name="Пользователь",
    )

    # Тип взаимодействия
    interaction_type = models.CharField(
        max_length=20,
        choices=InteractionType.choices,
        verbose_name="Тип взаимодействия",
    )

    # Дополнительные данные (для комментариев)
    text = models.TextField(
        blank=True, null=True, verbose_name="Текст (для комментариев)"
    )

    # Родительский комментарий (для ответов)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        verbose_name="Ответ на комментарий",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "interactions_interaction"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["user", "content_type", "object_id"]),
            models.Index(fields=["interaction_type"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]
        verbose_name = "Взаимодействие"
        verbose_name_plural = "Взаимодействия"

    def __str__(self):
        return f"{self.user.email} - {self.interaction_type} - {self.content_object}"

    @classmethod
    def toggle_interaction(cls, user, content_object, interaction_type):
        """
        Переключение взаимодействия (лайк/дизлайк/избранное/прочитано)
        """
        content_type = ContentType.objects.get_for_model(content_object)

        interaction, created = cls.objects.get_or_create(
            user=user,
            content_type=content_type,
            object_id=content_object.id,
            interaction_type=interaction_type,
            defaults={"text": ""},
        )

        if not created:
            interaction.delete()
            return {"action": "removed", "interaction": None}

        return {"action": "added", "interaction": interaction}

    @classmethod
    def get_counts(cls, content_object):
        """
        Получить количество всех взаимодействий для объекта
        """
        content_type = ContentType.objects.get_for_model(content_object)
        queryset = cls.objects.filter(
            content_type=content_type, object_id=content_object.id
        )

        return {
            "likes": queryset.filter(interaction_type=cls.InteractionType.LIKE).count(),
            "dislikes": queryset.filter(
                interaction_type=cls.InteractionType.DISLIKE
            ).count(),
            "favorites": queryset.filter(
                interaction_type=cls.InteractionType.FAVORITE
            ).count(),
            "reads": queryset.filter(interaction_type=cls.InteractionType.READ).count(),
            "views": queryset.filter(interaction_type=cls.InteractionType.VIEW).count(),
            "comments": queryset.filter(
                interaction_type=cls.InteractionType.LIKE, text__isnull=False
            ).count(),  # Комментарии хранятся как LIKE с текстом
        }

    @classmethod
    def get_user_interaction(cls, user, content_object, interaction_type):
        """
        Проверить, есть ли у пользователя определенное взаимодействие
        """
        if not user or not user.is_authenticated:
            return None

        content_type = ContentType.objects.get_for_model(content_object)
        return cls.objects.filter(
            user=user,
            content_type=content_type,
            object_id=content_object.id,
            interaction_type=interaction_type,
        ).first()
