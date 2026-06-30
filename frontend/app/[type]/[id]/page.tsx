"use client";

import { useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useContentItem } from "@/hooks/useContent";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { CommentSection } from "@/components/interactions/CommentSection";
import { ReviewSection } from "@/components/books/ReviewSection";
import { QuizSection } from "@/components/books/QuizSection";
import { ActionButtons } from "@/components/interactions/ActionButtons";

// ✅ Определяем тип из пути
const getContentTypeFromPath = (pathname: string): string => {
  if (pathname.startsWith("/books")) return "book";
  if (pathname.startsWith("/movies")) return "movie";
  if (pathname.startsWith("/paintings")) return "painting";
  if (pathname.startsWith("/music")) return "music";
  return "book";
};

const typeEmojis: Record<string, string> = {
  book: "📚",
  movie: "🎬",
  painting: "🖼️",
  music: "🎵",
};

const typeLabels: Record<string, string> = {
  book: "Книга",
  movie: "Фильм",
  painting: "Картина",
  music: "Музыка",
};

const typePlural: Record<string, string> = {
  book: "книг",
  movie: "фильмов",
  painting: "картин",
  music: "музыки",
};

export default function ContentDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const id = parseInt(params.id as string);
  const { content, isLoading, isError } = useContentItem(id);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"comments" | "reviews" | "quiz">(
    "comments",
  );

  // ✅ Определяем тип из пути
  const type = getContentTypeFromPath(pathname);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("🔗 Ссылка скопирована!", "success");
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showToast("🔗 Ссылка скопирована!", "success");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (isError || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Не найдено</p>
          <Link
            href={`/${type === "book" ? "books" : type === "movie" ? "movies" : type === "painting" ? "paintings" : "music"}`}
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            ← Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  const coverUrl = content.cover_url;
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const author =
    content.extra_data?.author ||
    content.extra_data?.composer ||
    content.extra_data?.artist ||
    "";

  // ✅ Определяем путь для ссылки назад
  const backPath =
    type === "book"
      ? "/books"
      : type === "movie"
        ? "/movies"
        : type === "painting"
          ? "/paintings"
          : "/music";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <Link
            href={backPath}
            className="text-blue-600 hover:underline inline-block"
          >
            ← Все {typePlural[type]}
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm"
          >
            📤 Поделиться
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Обложка и заголовок */}
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-100 flex items-center justify-center p-6">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={content.title}
                  className="w-full max-h-96 object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-6xl text-gray-300">
                  {typeEmojis[content.content_type]}
                </div>
              )}
            </div>

            <div className="md:w-2/3 p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-800">
                {content.title}
              </h1>
              {author && (
                <p className="text-xl text-gray-600 mt-1">✍️ {author}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {content.genre}
                </span>
                {content.year && (
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                    📅 {content.year}
                  </span>
                )}
                {content.country && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    🌍 {content.country}
                  </span>
                )}
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  ⭐ {content.rating}
                </span>
                {content.hours_to_read > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    ⏱️ {content.hours_to_read} ч
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>👁️ {content.views_count || 0} просмотров</span>
                <span>📅 Добавлено: {formatDate(content.created_at)}</span>
                <span>🔄 Обновлено: {formatDate(content.updated_at)}</span>
              </div>

              <div className="mt-6">
                <ActionButtons
                  content_type="content.content"
                  object_id={content.id}
                />
              </div>
            </div>
          </div>

          {/* Детали */}
          <div className="p-6 md:p-8 border-t space-y-6">
            {content.brief_summary && (
              <div>
                <h2 className="text-xl font-semibold mb-3">
                  📖 Краткое содержание
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {content.brief_summary}
                </p>
              </div>
            )}

            {content.characters && content.characters.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">🎭 Персонажи</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {content.characters.map((character: any) => (
                    <div
                      key={character.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-start gap-3 hover:bg-gray-100 transition"
                    >
                      {character.image_url ? (
                        <img
                          src={character.image_url}
                          alt={character.full_name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {character.first_name?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {character.full_name}
                        </p>
                        {character.about && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {character.about}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold mb-3">📝 Описание</h2>
              <p className="text-gray-700 leading-relaxed">
                {content.description}
              </p>
            </div>

            {content.review && (
              <div>
                <h2 className="text-xl font-semibold mb-3">✍️ Рецензия</h2>
                <p className="text-gray-700 leading-relaxed">
                  {content.review}
                </p>
              </div>
            )}

            {content.interesting_facts &&
              content.interesting_facts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    💡 Интересные факты
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {content.interesting_facts.map(
                      (
                        fact: { title: string; fact: string },
                        index: number,
                      ) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <h3 className="font-semibold text-blue-800 text-sm mb-1">
                            {fact.title}
                          </h3>
                          <p className="text-gray-700 text-sm">{fact.fact}</p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {content.ideas && (
              <div>
                <h2 className="text-xl font-semibold mb-3">
                  💡 Идеи из произведения
                </h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.ideas}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Вкладки */}
          <div className="flex border-b bg-white px-6 pt-4">
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-4 py-2 text-sm font-medium transition ${activeTab === "comments" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              💬 Комментарии
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-2 text-sm font-medium transition ${activeTab === "reviews" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              ⭐ Отзывы ({content.reviews_count || 0})
              {content.rating > 0 && ` • ${content.rating}/10`}
            </button>
            {content.quiz_questions && content.quiz_questions.length > 0 && (
              <button
                onClick={() => setActiveTab("quiz")}
                className={`px-4 py-2 text-sm font-medium transition ${activeTab === "quiz" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                🧠 Тест
              </button>
            )}
          </div>

          <div className="bg-white rounded-b-2xl shadow-xl p-6 md:p-8">
            {activeTab === "comments" && (
              <CommentSection
                content_type="content.content"
                object_id={content.id}
              />
            )}
            {activeTab === "reviews" && (
              <ReviewSection contentId={content.id} />
            )}
            {activeTab === "quiz" && (
              <QuizSection
                contentId={content.id}
                questions={content.quiz_questions || []}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
