from rest_framework import serializers
from .models import Content, Character, Review, ReviewReaction, QuizQuestion


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


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ["id", "question", "options", "correct_answer"]


class ReviewReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewReaction
        fields = ["id", "reaction_type", "created_at"]


class ReviewCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=10)
    text = serializers.CharField(max_length=5000)


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    user_avatar = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()  # ✅ Добавляем

    class Meta:
        model = Review
        fields = [
            "id",
            "content",
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
            "user_reaction",  # ✅ Добавляем
        ]
        read_only_fields = ["user", "content", "created_at", "updated_at"]

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


class ContentListSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    content_type_display = serializers.ReadOnlyField(source="get_content_type_display")
    characters = CharacterSerializer(many=True, read_only=True)

    class Meta:
        model = Content
        fields = [
            "id",
            "content_type",
            "content_type_display",
            "title",
            "description",
            "cover",
            "cover_url",
            "short_description",
            "rating",
            "year",
            "genre",
            "country",
            "views_count",
            "hours_to_read",
            "is_active",
            "created_at",
            "updated_at",
            "reviews_count",
            "characters",
        ]

    def get_cover_url(self, obj):
        return obj.cover_url

    def get_short_description(self, obj):
        return obj.short_description

    def get_reviews_count(self, obj):
        return obj.reviews.filter(is_active=True).count()


class ContentDetailSerializer(ContentListSerializer):
    """Детальный сериализатор с полной информацией"""

    quiz_questions = QuizQuestionSerializer(many=True, read_only=True)
    review = serializers.ReadOnlyField(source="review_text")
    brief_summary = serializers.ReadOnlyField()
    ideas = serializers.ReadOnlyField()
    interesting_facts = serializers.ReadOnlyField()
    extra_data = serializers.ReadOnlyField()

    class Meta(ContentListSerializer.Meta):
        fields = ContentListSerializer.Meta.fields + [
            "brief_summary",
            "review",
            "ideas",
            "interesting_facts",
            "extra_data",
            "quiz_questions",
        ]
