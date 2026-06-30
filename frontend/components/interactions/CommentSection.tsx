"use client";

import { useState } from "react";
import { useInteractions } from "@/hooks/useInteractions";
import { CommentItem } from "./CommentItem";

interface CommentSectionProps {
  content_type: string;
  object_id: number;
}

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

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-xl font-semibold mb-4">
        💬 Комментарии ({comments.length})
      </h3>

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

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Пока нет комментариев. Будьте первым!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              content_type={content_type}
              object_id={object_id}
              onLikeChange={refetch}
            />
          ))
        )}
      </div>
    </div>
  );
}
