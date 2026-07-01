from django.contrib import admin
from django.utils.html import format_html
from .models import Content, Character, Person, Course, Lesson


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "content_type", "cover_preview", "is_active")
    list_filter = ("content_type", "genre", "country", "is_active")
    search_fields = ("title", "description", "author", "genre")
    list_per_page = 20

    fieldsets = (
        ("Основное", {"fields": ("content_type", "title", "description")}),
        ("Детали", {"fields": ("genre", "country", "year", "rating", "views_count")}),
        ("Медиа", {"fields": ("cover",), "classes": ("collapse",)}),
        (
            "Дополнительно",
            {
                "fields": (
                    "brief_summary",
                    "review",
                    "ideas",
                    "interesting_facts",
                    "extra_data",
                ),
                "classes": ("collapse",),
            },
        ),
        ("Статус", {"fields": ("is_active",), "classes": ("collapse",)}),
    )

    readonly_fields = ("created_at", "updated_at")

    def cover_preview(self, obj):
        if obj.cover:
            return format_html(
                '<img src="{}" width="100" height="140" style="object-fit:cover; border-radius:4px;" />',
                obj.cover.url,
            )
        return "Нет обложки"

    cover_preview.short_description = "Обложка"


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "occupation", "image_preview", "is_active")
    list_filter = ("occupation", "birth_country", "is_active")
    search_fields = ("first_name", "last_name", "biography")

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="50" height="50" style="object-fit:cover; border-radius:50%;" />',
                obj.image.url,
            )
        return "Нет фото"

    image_preview.short_description = "Фото"


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "topic",
        "cover_preview",
        "lessons_count",
        "is_active",
    )
    list_filter = ("topic", "is_active")
    search_fields = ("title", "description", "topic")

    def cover_preview(self, obj):
        if obj.cover:
            return format_html(
                '<img src="{}" width="100" height="70" style="object-fit:cover; border-radius:4px;" />',
                obj.cover.url,
            )
        return "Нет обложки"

    cover_preview.short_description = "Обложка"

    def lessons_count(self, obj):
        return obj.lessons.filter(is_active=True).count()

    lessons_count.short_description = "Уроков"


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "course", "duration", "order", "is_active")
    list_filter = ("course", "is_active")
    search_fields = ("title", "content")
    ordering = ("course", "order")


@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "content", "image_preview")
    list_filter = ("content",)
    search_fields = ("first_name", "last_name", "about")

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="40" height="40" style="object-fit:cover; border-radius:50%;" />',
                obj.image.url,
            )
        return "Нет фото"

    image_preview.short_description = "Фото"
