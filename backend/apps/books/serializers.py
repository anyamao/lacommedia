from rest_framework import serializers
from .models import Book, Character


class CharacterSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Character
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "about",
            "image",
            "image_url",
        ]

    def get_image_url(self, obj):
        return obj.image_url


class BookSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    characters = CharacterSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = [
            "id",
            "name",
            "author",
            "country",
            "genre",
            "year",
            "description",
            "rating",
            "cover",
            "cover_url",
            "review",
            "short_description",
            "is_active",
            "created_at",
            "updated_at",
            "views_count",
            "hours_to_read",
            "brief_summary",
            "characters",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_cover_url(self, obj):
        if obj.cover:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.cover.url)
            return obj.cover.url
        return None

    def get_short_description(self, obj):
        return obj.short_description
