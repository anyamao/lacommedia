"use client";

import { useToast } from "@/context/ToastContext";
import { useState } from "react";
import { reviewService } from "@/services/reviewService";
import { useReviews } from "@/hooks/useReviews";
import { Review } from "@/lib/api/types";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiClient } from "@/lib/api/client"; // ✅ Импорт

interface ReviewSectionProps {
  contentId: number;
}

export function ReviewSection({ contentId }: ReviewSectionProps) {
  const {
    reviews,
    loading,
    createReview,
    updateReview,
    deleteReview,
    refetch,
  } = useReviews(contentId);
  const [isWriting, setIsWriting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<number | null>(null);
  const { showToast } = useToast();

  const userReview = reviews.find((r) => r.can_edit);
  const hasReview = !!userReview;
  const handleReaction = async (
    e: React.MouseEvent,
    reviewId: number,
    reactionType: "like" | "dislike",
  ) => {
    e.preventDefault(); // ✅ Предотвращаем стандартное поведение
    e.stopPropagation(); // ✅ Останавливаем всплытие

    try {
      const response = await reviewService.toggleReviewReaction(
        reviewId,
        reactionType,
      );

      if (response.action === "added") {
        showToast(
          reactionType === "like"
            ? "👍 Лайк поставлен"
            : "👎 Дизлайк поставлен",
          "success",
        );
      } else if (response.action === "removed") {
        showToast("Реакция убрана", "info");
      } else if (response.action === "changed") {
        showToast("Реакция изменена", "info");
      }

      refetch();
    } catch (error: any) {
      console.error("Reaction error:", error);
      const errorMessage =
        error.response?.data?.error || "Ошибка при реакции на отзыв";
      showToast(errorMessage, "error");
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || rating === 0) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateReview(editingId, rating, text);
      } else {
        await createReview(rating, text);
      }
      setIsWriting(false);
      setEditingId(null);
      setRating(5);
      setText("");
    } catch (error) {
      // Ошибка уже обработана в хуке
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setText(review.text);
    setIsWriting(true);
  };

  const handleDeleteClick = (id: number) => {
    setReviewToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (reviewToDelete) {
      await deleteReview(reviewToDelete);
      setReviewToDelete(null);
    }
    setShowDeleteConfirm(false);
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 4) return "text-red-600 border-red-200 bg-red-50";
    if (rating <= 6) return "text-gray-600 border-gray-200 bg-gray-50";
    return "text-green-600 border-green-200 bg-green-50";
  };

  const getRatingEmoji = (rating: number) => {
    if (rating <= 4) return "😞";
    if (rating <= 6) return "😐";
    return "😊";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">⭐ Отзывы ({reviews.length})</h3>
        {!hasReview && !isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ✍️ Написать отзыв
          </button>
        )}
      </div>

      {/* Форма */}
      {isWriting && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Оценка: {hoverRating || rating} ⭐
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition ${
                    (hoverRating || rating) >= star
                      ? "text-yellow-500"
                      : "text-gray-300 hover:text-yellow-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {rating <= 4 && "🔴 Негативный отзыв"}
              {rating >= 5 && rating <= 6 && "🟡 Нейтральный отзыв"}
              {rating >= 7 && "🟢 Положительный отзыв"}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Поделитесь своим мнением о книге..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            required
          />

          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting || !text.trim() || rating === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting
                ? "Сохранение..."
                : editingId
                  ? "Обновить"
                  : "Опубликовать"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsWriting(false);
                setEditingId(null);
                setRating(5);
                setText("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Список отзывов */}
      {loading ? (
        <div className="text-gray-500 text-center py-4">
          Загрузка отзывов...
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p>Пока нет отзывов. Будьте первым!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`border rounded-lg p-4 ${getRatingColor(review.rating)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${review.username}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition">
                      {review.username?.[0]?.toUpperCase() || "U"}
                    </div>
                  </Link>
                  <div>
                    <Link
                      href={`/profile/${review.username}`}
                      className="font-semibold hover:text-blue-600 hover:underline"
                    >
                      {review.username}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getRatingEmoji(review.rating)}
                      </span>
                      <span className="font-bold text-lg">
                        {review.rating}/10
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {review.can_edit && (
                    <>
                      <button
                        onClick={() => handleEdit(review)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteClick(review.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>

              <p className="mt-2 text-gray-700">{review.text}</p>

              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={() => handleReaction(review.id, "like")}
                  className={`flex items-center gap-1 text-sm transition ${
                    review.user_reaction === "like"
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-blue-600"
                  }`}
                >
                  👍 {review.likes_count > 0 && review.likes_count}
                </button>
                <button
                  onClick={() => handleReaction(review.id, "dislike")}
                  className={`flex items-center gap-1 text-sm transition ${
                    review.user_reaction === "dislike"
                      ? "text-red-600"
                      : "text-gray-500 hover:text-red-600"
                  }`}
                >
                  👎 {review.dislikes_count > 0 && review.dislikes_count}
                </button>
                <span className="text-xs text-gray-400">
                  {review.rating <= 4
                    ? "🔴 Негативный"
                    : review.rating <= 6
                      ? "🟡 Нейтральный"
                      : "🟢 Положительный"}
                </span>
                {review.created_at !== review.updated_at && (
                  <span className="text-gray-400 text-xs">
                    (отредактировано)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ConfirmDialog для удаления */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Удалить отзыв?"
        message="Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        confirmColor="red"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setReviewToDelete(null);
        }}
      />
    </div>
  );
}
