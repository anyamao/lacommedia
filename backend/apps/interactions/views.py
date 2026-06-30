from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from .models import Interaction
from .serializers import (
    InteractionSerializer,
    CommentCreateSerializer,
    InteractionToggleSerializer,
)


class InteractionViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = InteractionSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Interaction.objects.filter(user=self.request.user)
        return Interaction.objects.none()

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        """Переключить взаимодействие (лайк/дизлайк/избранное/прочитано)"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = InteractionToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        content_type = data["content_type"]
        object_id = data["object_id"]
        interaction_type = data["interaction_type"]

        try:
            ct = ContentType.objects.get(
                app_label=content_type.split(".")[0], model=content_type.split(".")[1]
            )
        except ContentType.DoesNotExist:
            return Response(
                {"error": "Invalid content_type"}, status=status.HTTP_400_BAD_REQUEST
            )

        model_class = ct.model_class()
        obj = get_object_or_404(model_class, id=object_id)

        # Переключаем взаимодействие
        existing = Interaction.objects.filter(
            user=request.user,
            content_type=ct,
            object_id=obj.id,
            interaction_type=interaction_type,
        ).first()

        if existing:
            existing.delete()
            action = "removed"
            interaction = None
        else:
            interaction = Interaction.objects.create(
                user=request.user,
                content_type=ct,
                object_id=obj.id,
                interaction_type=interaction_type,
                text="",
            )
            action = "added"

        # Считаем количество
        counts = {
            "likes": Interaction.objects.filter(
                content_type=ct,
                object_id=obj.id,
                interaction_type=Interaction.InteractionType.LIKE,
            ).count(),
            "dislikes": Interaction.objects.filter(
                content_type=ct,
                object_id=obj.id,
                interaction_type=Interaction.InteractionType.DISLIKE,
            ).count(),
            "favorites": Interaction.objects.filter(
                content_type=ct,
                object_id=obj.id,
                interaction_type=Interaction.InteractionType.FAVORITE,
            ).count(),
            "reads": Interaction.objects.filter(
                content_type=ct,
                object_id=obj.id,
                interaction_type=Interaction.InteractionType.READ,
            ).count(),
            "views": Interaction.objects.filter(
                content_type=ct,
                object_id=obj.id,
                interaction_type=Interaction.InteractionType.VIEW,
            ).count(),
            "comments": Interaction.objects.filter(
                content_type=ct,
                object_id=obj.id,
                interaction_type=Interaction.InteractionType.LIKE,
                text__isnull=False,
            ).count(),
        }

        return Response(
            {
                "action": action,
                "counts": counts,
                "interaction": InteractionSerializer(interaction).data
                if interaction
                else None,
            }
        )

    @action(detail=False, methods=["post"])
    def add_comment(self, request):
        """Добавить комментарий к объекту"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        content_type = data["content_type"]
        object_id = data["object_id"]
        text = data["text"]
        parent_id = data.get("parent_id")

        try:
            ct = ContentType.objects.get(
                app_label=content_type.split(".")[0], model=content_type.split(".")[1]
            )
        except ContentType.DoesNotExist:
            return Response(
                {"error": "Invalid content_type"}, status=status.HTTP_400_BAD_REQUEST
            )

        model_class = ct.model_class()
        obj = get_object_or_404(model_class, id=object_id)

        comment = Interaction.objects.create(
            user=request.user,
            content_type=ct,
            object_id=obj.id,
            interaction_type=Interaction.InteractionType.LIKE,
            text=text,
            parent_id=parent_id,
        )

        return Response(
            InteractionSerializer(comment).data, status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=["get"])
    def comments(self, request):
        """Получить комментарии к объекту"""
        content_type = request.query_params.get("content_type")
        object_id = request.query_params.get("object_id")

        if not content_type or not object_id:
            return Response(
                {"error": "content_type and object_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ct = ContentType.objects.get(
                app_label=content_type.split(".")[0], model=content_type.split(".")[1]
            )
        except ContentType.DoesNotExist:
            return Response(
                {"error": "Invalid content_type"}, status=status.HTTP_400_BAD_REQUEST
            )

        comments = (
            Interaction.objects.filter(
                content_type=ct,
                object_id=object_id,
                interaction_type=Interaction.InteractionType.LIKE,
                text__isnull=False,
            )
            .select_related("user")
            .order_by("-created_at")
        )

        serializer = InteractionSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def user_interaction(self, request):
        """Получить все взаимодействия текущего пользователя с объектом"""
        if not request.user.is_authenticated:
            return Response({})

        content_type = request.query_params.get("content_type")
        object_id = request.query_params.get("object_id")

        if not content_type or not object_id:
            return Response(
                {"error": "content_type and object_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ct = ContentType.objects.get(
                app_label=content_type.split(".")[0], model=content_type.split(".")[1]
            )
        except ContentType.DoesNotExist:
            return Response(
                {"error": "Invalid content_type"}, status=status.HTTP_400_BAD_REQUEST
            )

        interactions = Interaction.objects.filter(
            user=request.user, content_type=ct, object_id=object_id
        )

        result = {}
        for interaction in interactions:
            result[interaction.interaction_type] = True

        return Response(result)

    @action(detail=False, methods=["post"])
    def view(self, request):
        """Зафиксировать просмотр объекта (только для авторизованных, 1 раз)"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        content_type = request.data.get("content_type")
        object_id = request.data.get("object_id")

        if not content_type or not object_id:
            return Response(
                {"error": "content_type and object_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ct = ContentType.objects.get(
                app_label=content_type.split(".")[0], model=content_type.split(".")[1]
            )
        except ContentType.DoesNotExist:
            return Response(
                {"error": "Invalid content_type"}, status=status.HTTP_400_BAD_REQUEST
            )

        model_class = ct.model_class()
        obj = get_object_or_404(model_class, id=object_id)

        # Проверяем, был ли уже просмотр от этого пользователя
        existing_view = Interaction.objects.filter(
            user=request.user,
            content_type=ct,
            object_id=obj.id,
            interaction_type=Interaction.InteractionType.VIEW,
        ).exists()

        if not existing_view:
            # Увеличиваем счетчик просмотров
            if hasattr(obj, "views_count"):
                obj.views_count += 1
                obj.save(update_fields=["views_count"])

            # Сохраняем просмотр в историю
            Interaction.objects.create(
                user=request.user,
                content_type=ct,
                object_id=obj.id,
                interaction_type=Interaction.InteractionType.VIEW,
                text="",
            )

            return Response(
                {
                    "status": "view recorded",
                    "is_new": True,
                    "views_count": getattr(obj, "views_count", 0),
                }
            )
        else:
            return Response(
                {
                    "status": "already viewed",
                    "is_new": False,
                    "views_count": getattr(obj, "views_count", 0),
                }
            )
