"use client";

import { useState } from "react";
import { useInteractions } from "@/hooks/useInteractions";
import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  content_type: string;
  object_id: number;
}

const COMMENTS_PER_PAGE = 8;

export function CommentSection({
  content_type,
  object_id,
}: CommentSectionProps) {
  const { comments, addComment, loading, refetch } = useInteractions(
    content_type,
    object_id,
  );
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(text);
      setText("");
      refetch();
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleComments = showAll
    ? comments
    : comments.slice(0, COMMENTS_PER_PAGE);
  const hasMoreComments = comments.length > COMMENTS_PER_PAGE;

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          💬 Комментарии ({comments.length})
        </h3>
        {hasMoreComments && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showAll ? "🔼 Скрыть" : `🔽 Показать все (${comments.length})`}
          </button>
        )}
      </div>

      {/* Форма добавления */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напишите комментарий..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSubmitting ? "Отправка..." : "Отправить"}
        </button>
      </form>

      {/* Список комментариев */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Пока нет комментариев. Будьте первым!
          </p>
        ) : (
          <>
            {visibleComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                content_type={content_type}
                object_id={object_id}
                onLikeChange={refetch}
              />
            ))}
            {hasMoreComments && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full text-center text-sm text-blue-600 hover:underline py-2 border-t border-gray-100"
              >
                🔽 Показать еще {comments.length - COMMENTS_PER_PAGE}{" "}
                комментариев
              </button>
            )}
            {showAll && hasMoreComments && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full text-center text-sm text-gray-500 hover:underline py-2 border-t border-gray-100"
              >
                🔼 Свернуть
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
