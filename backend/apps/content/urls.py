from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ContentViewSet,
    ReviewListView,
    ReviewCreateView,
    ReviewUpdateView,
    ReviewDeleteView,
    ReviewReactionView,
    QuizQuestionsView,
)

router = DefaultRouter()
router.register("", ContentViewSet, basename="content")

urlpatterns = [
    path("", include(router.urls)),
    path("<int:content_id>/reviews/", ReviewListView.as_view(), name="review-list"),
    path(
        "<int:content_id>/reviews/create/",
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
    path("<int:content_id>/quiz/", QuizQuestionsView.as_view(), name="quiz-questions"),
]
