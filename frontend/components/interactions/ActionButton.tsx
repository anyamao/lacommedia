"use client";

import { useState } from "react";
import { useInteractions } from "@/hooks/useInteractions";

interface ActionButtonsProps {
  content_type: string;
  object_id: number;
  onInteractionChange?: () => void;
}

export function ActionButtons({
  content_type,
  object_id,
  onInteractionChange,
}: ActionButtonsProps) {
  const { interactions, toggle, loading } = useInteractions(
    content_type,
    object_id,
  );
  const [localLoading, setLocalLoading] = useState<string | null>(null);

  const handleToggle = async (type: string) => {
    setLocalLoading(type);
    try {
      await toggle(type);
      onInteractionChange?.();
    } catch (error) {
      console.error("Error toggling:", error);
    } finally {
      setLocalLoading(null);
    }
  };

  const isActive = (type: string) => !!interactions[type];
  const isLoading = (type: string) => localLoading === type || loading;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleToggle("like")}
        disabled={isLoading("like")}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
          isActive("like")
            ? "bg-blue-500 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
      >
        👍 {isActive("like") ? "Лайк" : "Нравится"}
      </button>

      <button
        onClick={() => handleToggle("dislike")}
        disabled={isLoading("dislike")}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
          isActive("dislike")
            ? "bg-red-500 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
      >
        👎 Дизлайк
      </button>

      <button
        onClick={() => handleToggle("favorite")}
        disabled={isLoading("favorite")}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
          isActive("favorite")
            ? "bg-yellow-500 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
      >
        ❤️ {isActive("favorite") ? "В избранном" : "В избранное"}
      </button>

      <button
        onClick={() => handleToggle("read")}
        disabled={isLoading("read")}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
          isActive("read")
            ? "bg-green-500 text-white"
            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
        }`}
      >
        📖 {isActive("read") ? "Прочитано" : "Отметить прочитанным"}
      </button>
    </div>
  );
}
