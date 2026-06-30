"use client";

import useSWR from "swr";
import { contentService } from "@/services/contentService";
import { Content, ContentFilters } from "@/lib/api/types";
import { interactionService } from "@/services/interactionService";
import { useEffect, useRef } from "react";

export function useContentList(filters?: ContentFilters) {
  // ✅ Ключ должен включать фильтры
  const cacheKey = filters ? ["content", JSON.stringify(filters)] : ["content"];

  const { data, error, mutate, isLoading } = useSWR(
    cacheKey,
    () => contentService.getContent(filters || {}), // ✅ Всегда передаем объект
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
      fallbackData: [],
    },
  );

  return {
    content: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useContentItem(id: number) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? [`/content/${id}/`] : null,
    () => contentService.getContentItem(id),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true,
    },
  );

  const hasRecordedView = useRef(false);

  useEffect(() => {
    if (data?.id && !hasRecordedView.current) {
      const token = localStorage.getItem("access_token");
      if (token) {
        hasRecordedView.current = true;
        interactionService
          .recordView("content.content", data.id)
          .then(() => mutate())
          .catch(() => {
            hasRecordedView.current = false;
          });
      }
    }
  }, [data?.id, mutate]);

  return {
    content: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}
