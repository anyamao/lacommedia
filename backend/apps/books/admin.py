from django.contrib import admin
from django.utils.html import format_html
from django.forms import inlineformset_factory
from .models import Book, Character


class CharacterInline(admin.TabularInline):
    model = Character
    extra = 1
    fields = ("first_name", "last_name", "about", "image")
    max_num = 20


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "author",
        "genre",
        "year",
        "rating_display",
        "hours_to_read",
        "cover_preview",
        "is_active",
    )
    list_filter = ("genre", "country", "year", "is_active", "created_at")
    search_fields = ("name", "author", "description", "genre", "brief_summary")
    inlines = [CharacterInline]

    fieldsets = (
        (
            "Основная информация",
            {"fields": ("name", "author", "country", "genre", "year")},
        ),
        ("Детали", {"fields": ("description", "review", "rating", "hours_to_read")}),
        ("Сюжет", {"fields": ("brief_summary",), "classes": ("collapse",)}),
        ("Медиа", {"fields": ("cover",), "classes": ("collapse",)}),
        ("Статус", {"fields": ("is_active",), "classes": ("collapse",)}),
    )

    def rating_display(self, obj):
        stars = "⭐" * int(obj.rating / 2) if obj.rating else ""
        return format_html(f"{stars} {obj.rating:.1f}")

    rating_display.short_description = "Рейтинг"

    def cover_preview(self, obj):
        if obj.cover:
            return format_html(
                '<img src="{}" width="50" height="70" style="object-fit:cover;" />',
                obj.cover.url,
            )
        return "Нет обложки"

    cover_preview.short_description = "Обложка"


@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "book", "created_at")
    list_filter = ("book",)
    search_fields = ("first_name", "last_name", "about")
