"use client";

import useSWR from "swr";
import { bookService } from "@/services/bookService";
import { Book, BookFilters } from "@/lib/api/types";

interface UseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null; // ✅ string | null
  mutate: () => void;
}

export function useBooks(filters?: BookFilters): UseBooksReturn {
  const cacheKey = filters ? ["books", JSON.stringify(filters)] : ["books"];

  const { data, error, mutate, isLoading } = useSWR(
    cacheKey,
    () => bookService.getBooks(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      keepPreviousData: true,
    },
  );

  return {
    books: data || [],
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null, // ✅ Преобразуем Error в string
    mutate,
  };
}
