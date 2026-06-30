from rest_framework import (
    viewsets,
    filters,
    status,
    generics,
    permissions,
    views,
)  # ✅ Добавляем permissions
from rest_framework.permissions import (
    IsAuthenticatedOrReadOnly,
    IsAuthenticated,
    AllowAny,
)  # ✅ Добавляем
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import FilterSet, CharFilter, NumberFilter, OrderingFilter
from django.db import models
from django.shortcuts import get_object_or_404
from .models import Book, Review
from .serializers import BookSerializer, ReviewSerializer, ReviewCreateSerializer


class BookFilter(FilterSet):
    """Кастомные фильтры для книг"""

    search = CharFilter(method="filter_search", label="Поиск")
    genre__in = CharFilter(method="filter_genre_in", label="Жанры (через запятую)")
    author__in = CharFilter(method="filter_author_in", label="Авторы (через запятую)")
    country__in = CharFilter(method="filter_country_in", label="Страны (через запятую)")
    year__gte = NumberFilter(field_name="year", lookup_expr="gte")
    year__lte = NumberFilter(field_name="year", lookup_expr="lte")
    hours_to_read__gte = NumberFilter(field_name="hours_to_read", lookup_expr="gte")
    hours_to_read__lte = NumberFilter(field_name="hours_to_read", lookup_expr="lte")
    rating__gte = NumberFilter(field_name="rating", lookup_expr="gte")
    rating__lte = NumberFilter(field_name="rating", lookup_expr="lte")

    class Meta:
        model = Book
        fields = ["genre", "author", "country", "year", "hours_to_read", "rating"]

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                models.Q(name__icontains=value) | models.Q(author__icontains=value)
            )
        return queryset

    def filter_genre_in(self, queryset, name, value):
        if value:
            genres = [g.strip() for g in value.split(",") if g.strip()]
            if genres:
                return queryset.filter(genre__in=genres)
        return queryset

    def filter_author_in(self, queryset, name, value):
        if value:
            authors = [a.strip() for a in value.split(",") if a.strip()]
            if authors:
                return queryset.filter(author__in=authors)
        return queryset

    def filter_country_in(self, queryset, name, value):
        if value:
            countries = [c.strip() for c in value.split(",") if c.strip()]
            if countries:
                return queryset.filter(country__in=countries)
        return queryset


class BookViewSet(viewsets.ModelViewSet):
    """API для управления книгами с фильтрацией и поиском"""

    queryset = Book.objects.filter(is_active=True).prefetch_related(
        "characters", "reviews"
    )
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]

    filterset_class = BookFilter

    ordering_fields = [
        "name",
        "author",
        "year",
        "rating",
        "created_at",
        "hours_to_read",
        "views_count",
        "average_rating",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()
        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                models.Q(name__icontains=search_param)
                | models.Q(author__icontains=search_param)
            )
        return queryset


# ============ ОТЗЫВЫ ============


class ReviewListView(generics.ListAPIView):
    """Список отзывов на книгу"""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]  # ✅ теперь permissions определен

    def get_queryset(self):
        book_id = self.kwargs.get("book_id")
        return Review.objects.filter(book_id=book_id, is_active=True).select_related(
            "user"
        )


class ReviewCreateView(generics.CreateAPIView):
    """Создание отзыва"""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        book_id = self.kwargs.get("book_id")
        book = get_object_or_404(Book, id=book_id, is_active=True)

        # ✅ Проверяем ВСЕ отзывы пользователя на эту книгу (включая неактивные)
        existing = Review.objects.filter(book=book, user=request.user).first()
        if existing:
            # Если отзыв был удален (неактивен) — обновляем его
            if not existing.is_active:
                serializer = ReviewCreateSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)

                existing.rating = serializer.validated_data["rating"]
                existing.text = serializer.validated_data["text"]
                existing.is_active = True
                existing.save()

                book.update_average_rating()

                return Response(
                    ReviewSerializer(existing, context={"request": request}).data,
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Вы уже оставили отзыв на эту книгу"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Создаем новый отзыв
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = Review.objects.create(
            book=book,
            user=request.user,
            rating=serializer.validated_data["rating"],
            text=serializer.validated_data["text"],
        )

        book.update_average_rating()

        return Response(
            ReviewSerializer(review, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ReviewReactionView(views.APIView):
    """Лайк/дизлайк отзыва"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, review_id):
        try:
            review = get_object_or_404(Review, id=review_id, is_active=True)
        except Review.DoesNotExist:
            return Response(
                {"error": "Отзыв не найден"}, status=status.HTTP_404_NOT_FOUND
            )

        reaction_type = request.data.get("reaction_type")

        if reaction_type not in ["like", "dislike"]:
            return Response(
                {"error": "reaction_type must be like or dislike"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = review.toggle_reaction(request.user, reaction_type)
        return Response(result)


class ReviewUpdateView(generics.UpdateAPIView):
    """Обновление отзыва"""

    permission_classes = [
        permissions.IsAuthenticated
    ]  # ✅ теперь permissions определен
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

        review.book.update_average_rating()

        return Response(ReviewSerializer(review, context={"request": request}).data)


class ReviewDeleteView(generics.DestroyAPIView):
    """Удаление отзыва"""

    permission_classes = [
        permissions.IsAuthenticated
    ]  # ✅ теперь permissions определен

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user, is_active=True)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        review.is_active = False
        review.save()
        review.book.update_average_rating()

        return Response({"message": "Отзыв удален"}, status=status.HTTP_200_OK)
