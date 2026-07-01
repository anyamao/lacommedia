from rest_framework import serializers
from .models import Content, Character, Review, ReviewReaction, QuizQuestion, Person


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


class PersonSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    is_alive = serializers.ReadOnlyField()
    related_content_count = serializers.SerializerMethodField()
    related_content = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "image",
            "image_url",
            "date_of_birth",
            "date_of_death",
            "is_alive",
            "birth_country",
            "occupation",
            "biography",
            "interesting_facts",
            "related_content_count",
            "related_content",
            "created_at",
            "updated_at",
            "is_active",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_image_url(self, obj):
        return obj.image_url

    def get_related_content_count(self, obj):
        """Количество связанного контента"""
        from .models import Content

        return Content.objects.filter(
            is_active=True, extra_data__person_id=obj.id
        ).count()

    def get_related_content(self, obj):
        """Связанный контент (до 6 штук)"""
        from .models import Content
        from .serializers import ContentListSerializer

        content = Content.objects.filter(
            is_active=True, extra_data__person_id=obj.id
        ).order_by("-created_at")[:6]

        return ContentListSerializer(content, many=True, context=self.context).data


class PersonListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    is_alive = serializers.ReadOnlyField()
    related_content_count = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "image",
            "image_url",
            "date_of_birth",
            "date_of_death",
            "is_alive",
            "birth_country",
            "occupation",
            "related_content_count",
        ]

    def get_image_url(self, obj):
        return obj.image_url

    def get_related_content_count(self, obj):
        from .models import Content

        return Content.objects.filter(
            is_active=True, extra_data__person_id=obj.id
        ).count()


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
