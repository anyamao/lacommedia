"use client";

import useSWR from "swr";
import { bookService } from "@/services/bookService";
import { Book, BookFilters } from "@/lib/api/types";

interface UseBooksReturn {
  books: Book[];
  isLoading: boolean;
  isError: Error | null;
  mutate: () => void;
}

export function useBooks(filters?: BookFilters): UseBooksReturn {
  // ✅ Ключ зависит от фильтров
  const cacheKey = filters ? ["books", JSON.stringify(filters)] : ["books"];

  const { data, error, mutate, isLoading } = useSWR(
    cacheKey,
    () => bookService.getBooks(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
      keepPreviousData: true,
      // ✅ Важно: возвращаем пустой массив, если данных нет
      fallbackData: [],
    },
  );

  return {
    books: data || [], // ✅ Всегда массив, даже если data undefined
    isLoading,
    isError: error || null,
    mutate,
  };
}
