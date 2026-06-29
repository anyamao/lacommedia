"use client";

import useSWR from "swr";
import { bookService } from "@/services/bookService";
import { Book, BookFilters } from "@/lib/api/types";

interface UseBooksReturn {
  books: Book[];
  loading: boolean;
  error: Error | null;
  mutate: () => void;
}

export function useBooks(filters?: BookFilters): UseBooksReturn {
  // Генерируем уникальный ключ на основе фильтров
  const key = ["books", JSON.stringify(filters || {})];

  const { data, error, mutate } = useSWR(
    key,
    () => bookService.getBooks(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
    },
  );

  return {
    books: data || [],
    loading: !error && !data,
    error: error || null,
    mutate,
  };
}
