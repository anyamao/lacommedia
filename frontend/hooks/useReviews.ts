"use client";

import { useState, useEffect, useCallback } from "react";
import { reviewService } from "@/services/reviewService";
import { Review } from "@/lib/api/types";
import { useToast } from "@/context/ToastContext";

export function useReviews(contentId: number) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewService.getReviews(contentId);
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const createReview = async (rating: number, text: string) => {
    try {
      const review = await reviewService.createReview(contentId, rating, text);
      setReviews((prev) => [review, ...prev]);
      showToast("Отзыв добавлен!", "success");
      return review;
    } catch (error: any) {
      showToast(
        error.response?.data?.error || "Ошибка при создании отзыва",
        "error",
      );
      throw error;
    }
  };

  const updateReview = async (
    reviewId: number,
    rating: number,
    text: string,
  ) => {
    try {
      const review = await reviewService.updateReview(reviewId, rating, text);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? review : r)));
      showToast("Отзыв обновлен!", "success");
      return review;
    } catch (error) {
      showToast("Ошибка при обновлении отзыва", "error");
      throw error;
    }
  };

  const deleteReview = async (reviewId: number) => {
    try {
      await reviewService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast("Отзыв удален", "info");
    } catch (error) {
      showToast("Ошибка при удалении отзыва", "error");
      throw error;
    }
  };

  return {
    reviews,
    loading,
    createReview,
    updateReview,
    deleteReview,
    refetch: fetchReviews,
  };
}
