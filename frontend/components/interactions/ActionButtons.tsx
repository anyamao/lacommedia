"use client";

import { useState } from "react";
import { useInteractions } from "@/hooks/useInteractions";
import { useToast } from "@/context/ToastContext";

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
  const { showToast } = useToast();
  const [localLoading, setLocalLoading] = useState<string | null>(null);

  const handleToggle = async (type: string) => {
    setLocalLoading(type);
    try {
      const result = await toggle(type);
      if (result?.action) {
        const messages = {
          like:
            result.action === "added" ? "❤️ Лайк поставлен" : "👍 Лайк убран",
          dislike:
            result.action === "added"
              ? "👎 Дизлайк поставлен"
              : "👎 Дизлайк убран",
          favorite:
            result.action === "added"
              ? "⭐ В избранное добавлено"
              : "⭐ Из избранного убрано",
          read:
            result.action === "added"
              ? "📖 Отмечено как прочитанное"
              : "📖 Отметка прочитанного убрана",
        };
        showToast(
          messages[type as keyof typeof messages] || "Действие выполнено",
          "success",
        );
      }
      onInteractionChange?.();
    } catch (error) {
      showToast("Ошибка при выполнении действия", "error");
    } finally {
      setLocalLoading(null);
    }
  };

  const isActive = (type: string) => !!interactions[type];
  const isLoading = (type: string) => localLoading === type || loading;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Лайк */}
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

      {/* Дизлайк */}
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

      {/* Избранное */}
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

      {/* Прочитано */}
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
