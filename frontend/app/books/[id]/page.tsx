"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useBook } from "@/hooks/useBook";
import { ActionButtons } from "@/components/interactions/ActionButtons";
import { CommentSection } from "@/components/interactions/CommentSection";
import Link from "next/link";
import { ReviewSection } from "@/components/books/ReviewSection";
export default function BookDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const { book, isLoading, isError } = useBook(id);
  const [activeTab, setActiveTab] = useState<"comments" | "reviews">(
    "comments",
  );
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка книги...</div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Книга не найдена</p>
          <Link
            href="/books"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            ← Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  const coverUrl =
    book.cover_url || (book.cover ? `https://lacomedia.ru${book.cover}` : null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/books"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Все книги
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Обложка и заголовок */}
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-100 flex items-center justify-center p-6">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={book.name}
                  className="w-full max-h-96 object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-6xl text-gray-300">
                  📖
                </div>
              )}
            </div>

            <div className="md:w-2/3 p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-800">{book.name}</h1>
              <p className="text-xl text-gray-600 mt-1">✍️ {book.author}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {book.genre}
                </span>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                  📅 {book.year}
                </span>
                {book.country && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    🌍 {book.country}
                  </span>
                )}
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  ⭐ {book.rating}
                </span>
                {book.hours_to_read > 0 && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    ⏱️ {book.hours_to_read} ч
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>👁️ {book.views_count || 0} просмотров</span>
                <span>📅 Добавлена: {formatDate(book.created_at)}</span>
                <span>🔄 Обновлена: {formatDate(book.updated_at)}</span>
              </div>

              <div className="mt-6">
                <ActionButtons content_type="books.book" object_id={book.id} />
              </div>
            </div>
          </div>

          {/* Детали */}
          <div className="p-6 md:p-8 border-t space-y-6">
            {/* Краткий пересказ */}
            {book.brief_summary && (
              <div>
                <h2 className="text-xl font-semibold mb-3">
                  📖 Краткий пересказ
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {book.brief_summary}
                </p>
              </div>
            )}

            {/* Главные герои */}
            {book.characters && book.characters.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">🎭 Главные герои</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {book.characters.map((character) => (
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

            {/* Описание */}
            <div>
              <h2 className="text-xl font-semibold mb-3">📝 Описание</h2>
              <p className="text-gray-700 leading-relaxed">
                {book.description}
              </p>
            </div>

            {/* Рецензия */}
            {book.review && (
              <div>
                <h2 className="text-xl font-semibold mb-3">✍️ Рецензия</h2>
                <p className="text-gray-700 leading-relaxed">{book.review}</p>
              </div>
            )}
            {book.ideas && (
              <div>
                <h2 className="text-xl font-semibold mb-3">💡 Идеи из книги</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {book.ideas}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex border-b bg-white px-6 pt-4">
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === "comments"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              💬 Комментарии (
              {book.interactions?.filter((i) => i.text)?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === "reviews"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              ⭐ Отзывы ({book.reviews_count || 0})
              {book.average_rating > 0 && ` • ${book.average_rating}/10`}
            </button>
          </div>

          {/* Контент вкладок */}
          <div className="bg-white rounded-b-2xl shadow-xl p-6 md:p-8">
            {activeTab === "comments" ? (
              <CommentSection content_type="books.book" object_id={book.id} />
            ) : (
              <ReviewSection bookId={book.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
