"use client";

import { useState } from "react";
import Link from "next/link";
import { Interaction } from "@/lib/api/types";
import { interactionService } from "@/services/interactionService";

interface CommentItemProps {
  comment: Interaction;
  content_type: string;
  object_id: number;
  onLikeChange?: () => void;
}

export function CommentItem({
  comment,
  content_type,
  object_id,
  onLikeChange,
}: CommentItemProps) {
  const [likes, setLikes] = useState(comment.likes_count || 0);
  const [dislikes, setDislikes] = useState(comment.dislikes_count || 0);
  const [userReaction, setUserReaction] = useState<
    "comment_like" | "comment_dislike" | null
  >(comment.user_reaction || null);
  const [loading, setLoading] = useState(false);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReaction = async (type: "comment_like" | "comment_dislike") => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await interactionService.toggleCommentReaction(
        comment.id,
        type,
      );
      setLikes(result.likes_count);
      setDislikes(result.dislikes_count);
      setUserReaction(
        result.user_reaction as "comment_like" | "comment_dislike" | null,
      );
      onLikeChange?.();
    } catch (error) {
      console.error("Error toggling reaction:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${comment.username}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition">
            {comment.username?.[0]?.toUpperCase() || "U"}
          </div>
        </Link>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${comment.username}`}
              className="font-semibold hover:text-blue-600 hover:underline"
            >
              {comment.username}
            </Link>
            <span className="text-sm text-gray-500">
              {formatDate(comment.created_at)}
            </span>
          </div>
          <p className="mt-1 text-gray-700">{comment.text}</p>

          {/* Кнопки лайков/дизлайков */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleReaction("comment_like")}
              disabled={loading}
              className={`flex items-center gap-1 text-sm transition ${
                userReaction === "comment_like"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              👍 {likes > 0 && likes}
            </button>
            <button
              onClick={() => handleReaction("comment_dislike")}
              disabled={loading}
              className={`flex items-center gap-1 text-sm transition ${
                userReaction === "comment_dislike"
                  ? "text-red-600"
                  : "text-gray-500 hover:text-red-600"
              }`}
            >
              👎 {dislikes > 0 && dislikes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
