from rest_framework import viewsets, generics, permissions, status, filters, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import FilterSet, CharFilter, NumberFilter
from django.db import models
from django.shortcuts import get_object_or_404
from .models import (
    Content,
    Review,
    ReviewReaction,
    QuizQuestion,
    Person,
    Course,
    Lesson,
    LessonQuizQuestion,
    CourseProgress,  # ✅ Добавляем
    LessonProgress,  # ✅ Добавляем
)


from .serializers import (
    ContentListSerializer,
    ContentDetailSerializer,
    ReviewSerializer,
    PersonSerializer,
    PersonListSerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    LessonSerializer,
    LessonQuizQuestionSerializer,
    ReviewCreateSerializer,
    QuizQuestionSerializer,
)
from rest_framework.permissions import (
    IsAuthenticatedOrReadOnly,
    IsAuthenticated,
    AllowAny,
)
from django.utils import timezone


class CourseViewSet(viewsets.ModelViewSet):
    """API для управления курсами"""

    queryset = Course.objects.filter(is_active=True).prefetch_related(
        "lessons", "lessons__quiz_questions"
    )
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = ["title", "description", "topic"]
    filterset_fields = ["topic", "is_active"]
    ordering_fields = ["title", "created_at", "total_time"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return CourseListSerializer
        return CourseDetailSerializer

    @action(detail=True, methods=["get"])
    def lessons(self, request, pk=None):
        """Получить все уроки курса"""
        course = self.get_object()
        lessons = course.lessons.filter(is_active=True).order_by("order")
        return Response(LessonSerializer(lessons, many=True).data)

    @action(detail=True, methods=["get"])
    def total_time(self, request, pk=None):
        """Получить общее время курса"""
        course = self.get_object()
        return Response({"total_time": course.total_time})

    @action(detail=True, methods=["get"])
    def progress(self, request, pk=None):
        """Получить прогресс пользователя по курсу"""
        course = self.get_object()

        if not request.user.is_authenticated:
            return Response(
                {"is_completed": False, "completed_at": None, "lessons": []}
            )

        # Прогресс курса
        course_progress = CourseProgress.objects.filter(
            course=course, user=request.user
        ).first()

        # Прогресс по урокам
        lessons_progress = []
        for lesson in course.lessons.filter(is_active=True).order_by("order"):
            lesson_progress = LessonProgress.objects.filter(
                lesson=lesson, user=request.user
            ).first()
            lessons_progress.append(
                {
                    "lesson_id": lesson.id,
                    "title": lesson.title,
                    "is_completed": lesson_progress.is_completed
                    if lesson_progress
                    else False,
                    "score": lesson_progress.score if lesson_progress else 0,
                }
            )

        return Response(
            {
                "is_completed": course_progress.is_completed
                if course_progress
                else False,
                "completed_at": course_progress.completed_at
                if course_progress
                else None,
                "lessons": lessons_progress,
                "total_lessons": course.lessons.filter(is_active=True).count(),
                "completed_lessons": sum(
                    1 for l in lessons_progress if l["is_completed"]
                ),
            }
        )

    @action(detail=True, methods=["post"])
    def complete_lesson(self, request, pk=None):
        """Завершить урок с результатом теста (сохраняется лучший результат)"""
        course = self.get_object()
        lesson_id = request.data.get("lesson_id")
        score = request.data.get("score", 0)

        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        lesson = get_object_or_404(Lesson, id=lesson_id, course=course, is_active=True)

        # Получаем или создаем прогресс урока
        lesson_progress, created = LessonProgress.objects.get_or_create(
            lesson=lesson, user=request.user
        )

        # ✅ Сохраняем лучший результат (всегда обновляем score, если он лучше)
        is_new_best = score > lesson_progress.score
        if is_new_best:
            lesson_progress.score = score

        # ✅ Если урок уже пройден — оставляем пройденным
        # Если урок не пройден и score >= 75 — помечаем как пройденный
        if not lesson_progress.is_completed and score >= 75:
            lesson_progress.is_completed = True
            lesson_progress.completed_at = timezone.now()
        # ✅ Если урок уже пройден — оставляем is_completed = True, даже если новый score < 75

        lesson_progress.save()

        # Проверяем прогресс курса
        all_lessons = course.lessons.filter(is_active=True).count()
        completed_lessons = LessonProgress.objects.filter(
            lesson__course=course,
            lesson__is_active=True,
            user=request.user,
            is_completed=True,
        ).count()

        course_progress, _ = CourseProgress.objects.get_or_create(
            course=course, user=request.user
        )

        # Курс пройден, если выполнено >=75% уроков
        course_completed = False
        completion_percentage = 0
        if all_lessons > 0:
            completion_percentage = (completed_lessons / all_lessons) * 100
            if completion_percentage >= 75 and not course_progress.is_completed:
                course_progress.is_completed = True
                course_progress.completed_at = timezone.now()
                course_progress.save()
                course_completed = True

        return Response(
            {
                "lesson_completed": lesson_progress.is_completed,
                "score": lesson_progress.score,
                "is_new_best": is_new_best,
                "course_completed": course_progress.is_completed,
                "course_completed_now": course_completed,
                "completed_lessons": completed_lessons,
                "total_lessons": all_lessons,
                "completion_percentage": completion_percentage,
            }
        )


class PersonViewSet(viewsets.ModelViewSet):
    """API для управления людьми"""

    queryset = Person.objects.filter(is_active=True)
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
        filters.SearchFilter,
    ]
    search_fields = ["first_name", "last_name", "biography", "birth_country"]
    filterset_fields = ["occupation", "birth_country"]
    ordering_fields = ["first_name", "last_name", "created_at"]
    ordering = ["last_name", "first_name"]

    def get_serializer_class(self):
        if self.action == "list":
            return PersonListSerializer
        return PersonSerializer

    @action(detail=True, methods=["get"])
    def content(self, request, pk=None):
        """Получить весь контент, связанный с человеком"""
        person = self.get_object()
        from .models import Content

        content = Content.objects.filter(
            is_active=True, extra_data__person_id=person.id
        ).order_by("-created_at")

        from .serializers import ContentListSerializer

        return Response(
            ContentListSerializer(content, many=True, context={"request": request}).data
        )


class ContentFilter(FilterSet):
    search = CharFilter(method="filter_search", label="Поиск")
    content_type = CharFilter(field_name="content_type", lookup_expr="exact")
    genre__in = CharFilter(method="filter_genre_in", label="Жанры")
    country__in = CharFilter(method="filter_country_in", label="Страны")
    year__gte = NumberFilter(field_name="year", lookup_expr="gte")
    year__lte = NumberFilter(field_name="year", lookup_expr="lte")
    rating__gte = NumberFilter(field_name="rating", lookup_expr="gte")
    rating__lte = NumberFilter(field_name="rating", lookup_expr="lte")

    class Meta:
        model = Content
        fields = ["content_type", "genre", "country", "year", "rating"]

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                models.Q(title__icontains=value)
                | models.Q(description__icontains=value)
            )
        return queryset

    def filter_genre_in(self, queryset, name, value):
        if value:
            genres = [g.strip() for g in value.split(",") if g.strip()]
            if genres:
                return queryset.filter(genre__in=genres)
        return queryset

    def filter_country_in(self, queryset, name, value):
        if value:
            countries = [c.strip() for c in value.split(",") if c.strip()]
            if countries:
                return queryset.filter(country__in=countries)
        return queryset


class ContentViewSet(viewsets.ModelViewSet):
    queryset = Content.objects.filter(is_active=True).prefetch_related(
        "characters", "reviews", "quiz_questions"
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ContentFilter
    ordering_fields = [
        "title",
        "year",
        "rating",
        "created_at",
        "views_count",
        "hours_to_read",
    ]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ContentListSerializer
        return ContentDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        content_type = self.request.query_params.get("content_type")
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        return queryset

    @action(detail=True, methods=["post"])
    def add_character(self, request, pk=None):
        content = self.get_object()
        serializer = CharacterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        character = serializer.save(content=content)
        return Response(
            CharacterSerializer(character).data, status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=["get"])
    def latest(self, request):
        """Получить 10 последних добавлений любого типа"""
        limit = int(request.query_params.get("limit", 10))
        latest_content = Content.objects.filter(is_active=True).order_by("-created_at")[
            :limit
        ]
        return Response(
            ContentListSerializer(
                latest_content, many=True, context={"request": request}
            ).data
        )

    @action(detail=False, methods=["get"])
    def favorites(self, request):
        """Получить все избранные объекты текущего пользователя"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        from apps.interactions.models import Interaction
        from django.contrib.contenttypes.models import ContentType

        # Получаем все взаимодействия типа 'favorite'
        favorite_interactions = Interaction.objects.filter(
            user=request.user, interaction_type="favorite"
        )

        # Собираем все объекты
        result = []
        for interaction in favorite_interactions:
            try:
                content_type = interaction.content_type
                model_class = content_type.model_class()
                obj = model_class.objects.get(id=interaction.object_id, is_active=True)

                # Сериализуем объект
                serializer = ContentListSerializer(obj, context={"request": request})
                result.append(serializer.data)
            except Exception as e:
                print(f"Error fetching favorite: {e}")
                continue

        return Response(result)

    @action(detail=True, methods=["get"])
    def similar(self, request, pk=None):
        """Получить похожий контент (по автору/жанру)"""
        content = self.get_object()

        similar_by_author = []
        similar_by_genre = []

        # 1. По тому же автору/создателю
        author = (
            content.extra_data.get("author")
            or content.extra_data.get("composer")
            or content.extra_data.get("artist")
        )
        if author:
            # Ищем контент с тем же автором
            # Проверяем все поля extra_data для поиска
            similar_by_author = Content.objects.filter(
                is_active=True, content_type=content.content_type
            ).exclude(id=content.id)

            # Фильтруем по автору
            filtered = []
            for item in similar_by_author:
                item_author = (
                    item.extra_data.get("author")
                    or item.extra_data.get("composer")
                    or item.extra_data.get("artist")
                )
                if item_author and item_author.lower() == author.lower():
                    filtered.append(item)
            similar_by_author = filtered[:6]

        # 2. По тому же жанру
        similar_by_genre = (
            Content.objects.filter(
                is_active=True, genre=content.genre, content_type=content.content_type
            )
            .exclude(id=content.id)
            .order_by("-created_at")[:6]
        )

        return Response(
            {
                "by_author": ContentListSerializer(
                    similar_by_author, many=True, context={"request": request}
                ).data,
                "by_genre": ContentListSerializer(
                    similar_by_genre, many=True, context={"request": request}
                ).data,
            }
        )


class ReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        content_id = self.kwargs.get("content_id")
        return Review.objects.filter(
            content_id=content_id, is_active=True
        ).select_related("user")


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        content_id = self.kwargs.get("content_id")
        content = get_object_or_404(Content, id=content_id, is_active=True)

        existing = Review.objects.filter(content=content, user=request.user).first()
        if existing:
            if not existing.is_active:
                serializer = ReviewCreateSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                existing.rating = serializer.validated_data["rating"]
                existing.text = serializer.validated_data["text"]
                existing.is_active = True
                existing.save()
                content.update_average_rating()
                return Response(
                    ReviewSerializer(existing, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Вы уже оставили отзыв на этот контент"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = Review.objects.create(
            content=content,
            user=request.user,
            rating=serializer.validated_data["rating"],
            text=serializer.validated_data["text"],
        )
        content.update_average_rating()

        return Response(
            ReviewSerializer(review, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ReviewUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def update(self, request, *args, **kwargs):
        review = self.get_object()
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review.rating = serializer.validated_data["rating"]
        review.text = serializer.validated_data["text"]
        review.save()
        review.content.update_average_rating()

        return Response(ReviewSerializer(review, context={"request": request}).data)


class ReviewDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user, is_active=True)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        review.is_active = False
        review.save()
        review.content.update_average_rating()
        return Response({"message": "Отзыв удален"}, status=status.HTTP_200_OK)


class ReviewReactionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, review_id):
        review = get_object_or_404(Review, id=review_id, is_active=True)
        reaction_type = request.data.get("reaction_type")

        if reaction_type not in ["like", "dislike"]:
            return Response(
                {"error": "reaction_type must be like or dislike"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = review.toggle_reaction(request.user, reaction_type)
        return Response(result)


class QuizQuestionsView(generics.ListAPIView):
    serializer_class = QuizQuestionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        content_id = self.kwargs.get("content_id")
        return QuizQuestion.objects.filter(content_id=content_id)


@action(detail=True, methods=["get"])
def similar(self, request, pk=None):
    """Получить похожий контент (по автору/жанру)"""
    content = self.get_object()

    # 1. По тому же автору/создателю
    author = (
        content.extra_data.get("author")
        or content.extra_data.get("composer")
        or content.extra_data.get("artist")
    )
    similar_by_author = []
    if author:
        similar_by_author = Content.objects.filter(
            is_active=True,
            extra_data__has_key="author"
            if content.extra_data.get("author")
            else "composer"
            if content.extra_data.get("composer")
            else "artist",
        ).exclude(id=content.id)
        # TODO: Фильтр по автору через JSONField
        similar_by_author = list(similar_by_author[:6])

    # 2. По тому же жанру
    similar_by_genre = (
        Content.objects.filter(
            is_active=True, genre=content.genre, content_type=content.content_type
        )
        .exclude(id=content.id)
        .order_by("-created_at")[:6]
    )

    return Response(
        {
            "by_author": ContentListSerializer(similar_by_author, many=True).data,
            "by_genre": ContentListSerializer(similar_by_genre, many=True).data,
        }
    )
