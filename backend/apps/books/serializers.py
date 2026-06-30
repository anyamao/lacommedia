from rest_framework import serializers
from django.db import models
from .models import Book, Character, Review


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
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    user_avatar = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            "id",
            "book",
            "user",
            "username",
            "user_avatar",
            "rating",
            "text",
            "created_at",
            "updated_at",
            "can_edit",
            "can_delete",
            "likes_count",
            "dislikes_count",
            "user_reaction",
        ]
        read_only_fields = ["user", "book", "created_at", "updated_at"]

    def get_user_avatar(self, obj):
        return obj.user.avatar_url if obj.user.avatar else None

    def get_can_edit(self, obj):
        request = self.context.get("request")
        return request and request.user == obj.user

    def get_can_delete(self, obj):
        request = self.context.get("request")
        return request and (request.user == obj.user or request.user.is_staff)

    def get_likes_count(self, obj):
        return obj.reactions.filter(reaction_type="like").count()

    def get_dislikes_count(self, obj):
        return obj.reactions.filter(reaction_type="dislike").count()

    def get_user_reaction(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        reaction = obj.reactions.filter(user=request.user).first()
        return reaction.reaction_type if reaction else None


class ReviewCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=10)
    text = serializers.CharField(max_length=5000)


class BookSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    characters = CharacterSerializer(many=True, read_only=True)
    reviews_count = serializers.SerializerMethodField()
    average_rating = serializers.DecimalField(
        max_digits=3, decimal_places=1, read_only=True
    )

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
            "average_rating",
            "reviews_count",
            "ideas",  # ✅ Отдельное поле, не слипшееся
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
        if obj.description:
            if len(obj.description) > 100:
                return obj.description[:97] + "..."
            return obj.description
        return ""

    def get_reviews_count(self, obj):
        return obj.reviews.filter(is_active=True).count()
