"use client";

import { useState, useEffect, useCallback } from "react";
import { interactionService } from "@/services/interactionService";
import { Interaction, InteractionCounts } from "@/lib/api/types";

export function useInteractions(content_type: string, object_id: number) {
  const [interactions, setInteractions] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<InteractionCounts | null>(null);
  const [comments, setComments] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [userInteractions, commentsData] = await Promise.all([
        interactionService.getUserInteraction(content_type, object_id),
        interactionService.getComments(content_type, object_id),
      ]);

      setInteractions(userInteractions || {});
      setComments(commentsData || []);
    } catch (error) {
      console.error("Error fetching interactions:", error);
    } finally {
      setLoading(false);
    }
  }, [content_type, object_id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggle = async (type: string) => {
    try {
      const response = await interactionService.toggle(
        content_type,
        object_id,
        type,
      );
      setCounts(response.counts);

      // Обновляем состояние взаимодействий
      setInteractions((prev) => ({
        ...prev,
        [type]: response.action === "added",
      }));

      return response;
    } catch (error) {
      console.error("Error toggling interaction:", error);
      throw error;
    }
  };

  const addComment = async (text: string, parentId?: number) => {
    try {
      const comment = await interactionService.addComment(
        content_type,
        object_id,
        text,
        parentId,
      );
      setComments((prev) => [comment, ...prev]);
      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  const recordView = useCallback(async () => {
    try {
      await interactionService.recordView(content_type, object_id);
    } catch (error) {
      console.error("Error recording view:", error);
    }
  }, [content_type, object_id]);

  return {
    interactions,
    counts,
    comments,
    loading,
    toggle,
    addComment,
    recordView,
    refetch: fetchAll,
  };
}
