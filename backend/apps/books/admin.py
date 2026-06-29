from django.contrib import admin
from django.utils.html import format_html
from .models import Book


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "author",
        "genre",
        "year",
        "rating_display",
        "cover_preview",
        "is_active",
    )

    list_filter = ("genre", "country", "year", "is_active", "created_at")

    search_fields = ("name", "author", "description", "genre")

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("name", "author", "country", "genre", "year")},
        ),
        ("Детали", {"fields": ("description", "review", "rating")}),
        ("Медиа", {"fields": ("cover",), "classes": ("collapse",)}),
        ("Статус", {"fields": ("is_active",), "classes": ("collapse",)}),
    )

    ordering = ("-created_at",)

    actions = ["make_active", "make_inactive"]

    list_per_page = 25

    readonly_fields = ("created_at", "updated_at")

    def rating_display(self, obj):
        """Отображает рейтинг звездочками"""
        stars = "⭐" * int(obj.rating / 2) if obj.rating else ""
        return format_html(f"{stars} {obj.rating:.1f}")

    rating_display.short_description = "Рейтинг"

    def cover_preview(self, obj):
        """Показывает миниатюру обложки"""
        if obj.cover:
            return format_html(
                '<img src="{}" width="50" height="70" style="object-fit:cover;" />',
                obj.cover.url,
            )
        return "Нет обложки"

    cover_preview.short_description = "Обложка"

    def make_active(self, request, queryset):
        queryset.update(is_active=True)

    make_active.short_description = "Активировать выбранные книги"

    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)

    make_inactive.short_description = "Деактивировать выбранные книги"
