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

        # ✅ Если это лайк или дизлайк — удаляем противоположный
        if interaction_type in ["like", "dislike"]:
            opposite_type = "dislike" if interaction_type == "like" else "like"
            Interaction.objects.filter(
                user=request.user,
                content_type=ct,
                object_id=obj.id,
                interaction_type=opposite_type,
            ).delete()

        # Переключаем текущий
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
                content_type=ct, object_id=obj.id, interaction_type="like"
            ).count(),
            "dislikes": Interaction.objects.filter(
                content_type=ct, object_id=obj.id, interaction_type="dislike"
            ).count(),
            "favorites": Interaction.objects.filter(
                content_type=ct, object_id=obj.id, interaction_type="favorite"
            ).count(),
            "reads": Interaction.objects.filter(
                content_type=ct, object_id=obj.id, interaction_type="read"
            ).count(),
            "views": Interaction.objects.filter(
                content_type=ct, object_id=obj.id, interaction_type="view"
            ).count(),
            "comments": Interaction.objects.filter(
                content_type=ct,
                object_id=obj.id,
                interaction_type="like",
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
    def toggle_comment_reaction(self, request):
        """Лайк/дизлайк комментария"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        comment_id = request.data.get("comment_id")
        reaction_type = request.data.get(
            "reaction_type"
        )  # 'comment_like' или 'comment_dislike'

        if not comment_id or not reaction_type:
            return Response(
                {"error": "comment_id and reaction_type required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reaction_type not in ["comment_like", "comment_dislike"]:
            return Response(
                {"error": "reaction_type must be comment_like or comment_dislike"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = Interaction.toggle_comment_reaction(
            request.user, comment_id, reaction_type
        )

        if result.get("error"):
            return Response(
                {"error": result["error"]}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(result)

    @action(detail=False, methods=["get"])
    def comments(self, request):
        """Получить комментарии к объекту с реакциями"""
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

        result = []
        for comment in comments:
            comment_data = InteractionSerializer(comment).data
            comment_data["likes_count"] = Interaction.objects.filter(
                comment=comment, interaction_type="comment_like"
            ).count()
            comment_data["dislikes_count"] = Interaction.objects.filter(
                comment=comment, interaction_type="comment_dislike"
            ).count()
            comment_data["user_reaction"] = None
            if request.user.is_authenticated:
                user_reaction = Interaction.objects.filter(
                    user=request.user,
                    comment=comment,
                    interaction_type__in=["comment_like", "comment_dislike"],
                ).first()
                if user_reaction:
                    comment_data["user_reaction"] = user_reaction.interaction_type
            result.append(comment_data)

        return Response(result)

    @action(detail=False, methods=["post"])
    def toggle_comment_like(self, request):
        """Лайк/дизлайк комментария"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        comment_id = request.data.get("comment_id")
        if not comment_id:
            return Response(
                {"error": "comment_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        result = Interaction.toggle_comment_like(request.user, comment_id)

        if result.get("error"):
            return Response(
                {"error": result["error"]}, status=status.HTTP_404_NOT_FOUND
            )

        # Считаем лайки комментария
        comment = Interaction.objects.get(id=comment_id)
        likes_count = Interaction.objects.filter(
            parent=comment, interaction_type="like"
        ).count()

        return Response({"action": result["action"], "likes_count": likes_count})

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
