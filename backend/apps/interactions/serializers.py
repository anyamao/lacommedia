from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import Interaction
from apps.books.models import Book


class InteractionSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
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

    def get_user_email(self, obj):
        return obj.user.email

    def get_username(self, obj):
        return obj.user.username

    def get_avatar_url(self, obj):
        return obj.user.avatar_url


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
