from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InteractionViewSet

router = DefaultRouter()
router.register("", InteractionViewSet, basename="interaction")

urlpatterns = [
    path("", include(router.urls)),
]
