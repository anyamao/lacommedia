"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import { Book } from "@/lib/api/types";
import { interactionService } from "@/services/interactionService";
import { useEffect, useRef } from "react";

export function useBook(id: number) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? [`/books/${id}/`] : null,
    () => apiClient.get<Book>(`/books/${id}/`),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    },
  );

  // ✅ Записываем просмотр только один раз
  const hasRecordedView = useRef(false);

  useEffect(() => {
    // ✅ Проверяем, что книга загружена, есть id и просмотр еще не записан
    if (data?.id && !hasRecordedView.current) {
      // ✅ Проверяем, что пользователь авторизован
      const token = localStorage.getItem("access_token");
      if (token) {
        hasRecordedView.current = true;
        interactionService
          .recordView("books.book", data.id)
          .then(() => {
            // Обновляем данные, чтобы показать новый счетчик
            mutate();
          })
          .catch((error) => {
            console.error("Error recording view:", error);
            // Если ошибка — разрешаем повторную попытку
            hasRecordedView.current = false;
          });
      }
    }
  }, [data?.id, mutate]);

  return {
    book: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}
