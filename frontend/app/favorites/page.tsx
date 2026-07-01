"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/context/ToastContext";

interface FavoriteItem {
  id: number;
  content_type: string;
  content_type_display: string;
  title: string;
  cover: string | null;
  cover_url: string | null;
  rating: number;
  genre: string;
  year: number | null;
  extra_data?: Record<string, any>;
}

const typeEmojis: Record<string, string> = {
  book: "📚",
  movie: "🎬",
  painting: "🖼️",
  music: "🎵",
  article: "📄",
};

const typeLabels: Record<string, string> = {
  book: "Книги",
  movie: "Фильмы",
  painting: "Картины",
  music: "Музыка",
  article: "Статьи",
};

const typePaths: Record<string, string> = {
  book: "books",
  movie: "movies",
  painting: "paintings",
  music: "music",
  article: "articles",
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        // ✅ Правильный эндпоинт
        const response = await apiClient.get("/content/favorites/");
        setFavorites(response || []);
      } catch (error: any) {
        console.error("Error fetching favorites:", error);
        if (error.response?.status === 401) {
          showToast("Войдите, чтобы видеть избранное", "info");
        } else {
          showToast("Ошибка загрузки избранного", "error");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [showToast]);

  const filteredFavorites =
    activeTab === "all"
      ? favorites
      : favorites.filter((f) => f.content_type === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">❤️ Избранное</h1>

        {/* Табы */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Все ({favorites.length})
          </button>
          {Object.entries(typeEmojis).map(([key, emoji]) => {
            const count = favorites.filter(
              (f) => f.content_type === key,
            ).length;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {emoji} {typeLabels[key]} ({count})
              </button>
            );
          })}
        </div>

        {/* Список избранного */}
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-2xl text-gray-400">❤️</p>
            <p className="text-gray-500 mt-2">У вас пока нет избранных</p>
            <p className="text-sm text-gray-400 mt-1">
              Нажмите ❤️ на странице контента, чтобы добавить в избранное
            </p>
            <Link
              href="/books"
              className="text-blue-600 hover:underline mt-4 inline-block"
            >
              Перейти к книгам
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFavorites.map((item) => {
              const author =
                item.extra_data?.author ||
                item.extra_data?.composer ||
                item.extra_data?.artist ||
                "";
              return (
                <Link
                  key={item.id}
                  href={`/${typePaths[item.content_type]}/${item.id}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition hover:-translate-y-1"
                >
                  <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl text-gray-300">
                        {typeEmojis[item.content_type]}
                      </span>
                    )}
                    <div className="absolute top-2 right-2 bg-black/75 text-white px-2 py-0.5 rounded-full text-xs">
                      ⭐ {item.rating}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400">
                      {item.content_type_display}
                    </p>
                    <h3 className="font-bold text-gray-800 truncate">
                      {item.title}
                    </h3>
                    {author && (
                      <p className="text-sm text-gray-600 truncate">{author}</p>
                    )}
                    <p className="text-sm text-gray-500">{item.genre}</p>
                    {item.year && (
                      <p className="text-sm text-gray-400">{item.year}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
