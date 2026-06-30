from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookViewSet,
    ReviewListView,
    ReviewCreateView,
    ReviewUpdateView,
    ReviewDeleteView,
    ReviewReactionView,
)

router = DefaultRouter()
router.register("", BookViewSet, basename="book")

urlpatterns = [
    path("", include(router.urls)),
    # Отзывы
    path("<int:book_id>/reviews/", ReviewListView.as_view(), name="review-list"),
    path(
        "<int:book_id>/reviews/create/",
        ReviewCreateView.as_view(),
        name="review-create",
    ),
    path("reviews/<int:pk>/", ReviewUpdateView.as_view(), name="review-update"),
    path("reviews/<int:pk>/delete/", ReviewDeleteView.as_view(), name="review-delete"),
    path(
        "reviews/<int:review_id>/react/",
        ReviewReactionView.as_view(),
        name="review-react",
    ),
]
