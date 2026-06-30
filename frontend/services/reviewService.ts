import { apiClient } from "@/lib/api/client";
import { Review } from "@/lib/api/types";

export class ReviewService {
  // ✅ Получение отзывов для контента
  async getReviews(contentId: number): Promise<Review[]> {
    return apiClient.get<Review[]>(`/content/${contentId}/reviews/`);
  }

  // ✅ Создание отзыва для контента
  async createReview(
    contentId: number,
    rating: number,
    text: string,
  ): Promise<Review> {
    return apiClient.post<Review>(`/content/${contentId}/reviews/create/`, {
      rating,
      text,
    });
  }

  // ✅ Обновление отзыва
  async updateReview(
    reviewId: number,
    rating: number,
    text: string,
  ): Promise<Review> {
    return apiClient.put<Review>(`/content/reviews/${reviewId}/`, {
      rating,
      text,
    });
  }

  // ✅ Удаление отзыва
  async deleteReview(reviewId: number): Promise<void> {
    return apiClient.delete(`/content/reviews/${reviewId}/delete/`);
  }

  // ✅ Реакция на отзыв (лайк/дизлайк)
  async toggleReviewReaction(
    reviewId: number,
    reactionType: "like" | "dislike",
  ): Promise<{
    action: string;
    likes_count: number;
    dislikes_count: number;
    user_reaction: string | null;
  }> {
    return apiClient.post(`/content/reviews/${reviewId}/react/`, {
      reaction_type: reactionType,
    });
  }
}

export const reviewService = new ReviewService();
