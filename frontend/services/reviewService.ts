import { apiClient } from "@/lib/api/client";
import { Review } from "@/lib/api/types";

export class ReviewService {
  async getReviews(bookId: number): Promise<Review[]> {
    return apiClient.get<Review[]>(`/books/${bookId}/reviews/`);
  }

  async createReview(
    bookId: number,
    rating: number,
    text: string,
  ): Promise<Review> {
    return apiClient.post<Review>(`/books/${bookId}/reviews/create/`, {
      rating,
      text,
    });
  }

  async updateReview(
    reviewId: number,
    rating: number,
    text: string,
  ): Promise<Review> {
    return apiClient.put<Review>(`/books/reviews/${reviewId}/`, {
      rating,
      text,
    });
  }

  async deleteReview(reviewId: number): Promise<void> {
    return apiClient.delete(`/books/reviews/${reviewId}/delete/`);
  }
}

export const reviewService = new ReviewService();
