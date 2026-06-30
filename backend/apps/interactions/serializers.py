from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Interaction
from apps.books.models import Book


class InteractionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Interaction
        fields = [
            "id",
            "user",
            "user_email",
            "username",
            "avatar_url",
            "interaction_type",
            "text",
            "parent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]

    def get_avatar_url(self, obj):
        if obj.user and obj.user.avatar:
            return obj.user.avatar.url
        return None


class CommentSerializer(serializers.ModelSerializer):
    """Сериализатор для комментариев с лайками"""

    user_email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    avatar_url = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Interaction
        fields = [
            "id",
            "user",
            "user_email",
            "username",
            "avatar_url",
            "interaction_type",
            "text",
            "parent",
            "created_at",
            "updated_at",
            "likes_count",
            "dislikes_count",
            "user_reaction",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]

    def get_avatar_url(self, obj):
        if obj.user and obj.user.avatar:
            return obj.user.avatar.url
        return None

    def get_likes_count(self, obj):
        return Interaction.objects.filter(
            comment=obj, interaction_type="comment_like"
        ).count()

    def get_dislikes_count(self, obj):
        return Interaction.objects.filter(
            comment=obj, interaction_type="comment_dislike"
        ).count()

    def get_user_reaction(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        reaction = Interaction.objects.filter(
            user=request.user,
            comment=obj,
            interaction_type__in=["comment_like", "comment_dislike"],
        ).first()
        return reaction.interaction_type if reaction else None


class CommentCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000)
    parent_id = serializers.IntegerField(required=False, allow_null=True)
    content_type = serializers.CharField()
    object_id = serializers.IntegerField()

    def validate_content_type(self, value):
        try:
            app_label, model = value.split(".")
            ContentType.objects.get(app_label=app_label, model=model)
        except (ValueError, ContentType.DoesNotExist):
            raise serializers.ValidationError("Invalid content type")
        return value


class InteractionToggleSerializer(serializers.Serializer):
    interaction_type = serializers.ChoiceField(
        choices=Interaction.InteractionType.choices
    )
    content_type = serializers.CharField()
    object_id = serializers.IntegerField()

    def validate_content_type(self, value):
        try:
            app_label, model = value.split(".")
            ContentType.objects.get(app_label=app_label, model=model)
        except (ValueError, ContentType.DoesNotExist):
            raise serializers.ValidationError("Invalid content type")
        return value
