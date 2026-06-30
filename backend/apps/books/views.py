from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import FilterSet, CharFilter, NumberFilter, OrderingFilter
from .models import Book
from .serializers import BookSerializer
from django.db import models


class BookFilter(FilterSet):
    """Кастомные фильтры для книг"""

    # Поиск по названию и автору
    search = CharFilter(method="filter_search", label="Поиск")

    # Фильтры по нескольким значениям (через запятую)
    genre__in = CharFilter(method="filter_genre_in", label="Жанры (через запятую)")
    author__in = CharFilter(method="filter_author_in", label="Авторы (через запятую)")
    country__in = CharFilter(method="filter_country_in", label="Страны (через запятую)")

    # Фильтры по диапазону
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
        """Поиск по названию или автору"""
        if value:
            return queryset.filter(
                models.Q(name__icontains=value) | models.Q(author__icontains=value)
            )
        return queryset

    def filter_genre_in(self, queryset, name, value):
        """Фильтр по нескольким жанрам"""
        if value:
            genres = [g.strip() for g in value.split(",") if g.strip()]
            if genres:
                return queryset.filter(genre__in=genres)
        return queryset

    def filter_author_in(self, queryset, name, value):
        """Фильтр по нескольким авторам"""
        if value:
            authors = [a.strip() for a in value.split(",") if a.strip()]
            if authors:
                return queryset.filter(author__in=authors)
        return queryset

    def filter_country_in(self, queryset, name, value):
        """Фильтр по нескольким странам"""
        if value:
            countries = [c.strip() for c in value.split(",") if c.strip()]
            if countries:
                return queryset.filter(country__in=countries)
        return queryset


class BookViewSet(viewsets.ModelViewSet):
    """API для управления книгами с фильтрацией и поиском"""

    queryset = Book.objects.filter(is_active=True).prefetch_related("characters")
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]

    filterset_class = BookFilter

    # Сортировка
    ordering_fields = [
        "name",
        "author",
        "year",
        "rating",
        "created_at",
        "hours_to_read",
        "views_count",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Если есть параметр search, используем его для поиска
        search_param = self.request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                models.Q(name__icontains=search_param)
                | models.Q(author__icontains=search_param)
            )

        return queryset
