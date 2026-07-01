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
    PersonViewSet,
    CourseViewSet,
)

router = DefaultRouter()
router.register(
    "content", ContentViewSet, basename="content"
)  # ✅ Добавляем 'content/'
router.register("people", PersonViewSet, basename="person")  # ✅ 'people/'
router.register("courses", CourseViewSet, basename="course")
urlpatterns = [
    path("", include(router.urls)),
    # Отзывы для контента
    path(
        "content/<int:content_id>/reviews/",
        ReviewListView.as_view(),
        name="review-list",
    ),
    path(
        "content/<int:content_id>/reviews/create/",
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
    path(
        "content/<int:content_id>/quiz/",
        QuizQuestionsView.as_view(),
        name="quiz-questions",
    ),
]
