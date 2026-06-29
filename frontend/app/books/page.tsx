"use client";

import { useState } from "react";
import { useBooks } from "@/hooks/useBooks";
import BookList from "@/components/books/BookList";
import { Book } from "@/lib/api/types";

export default function BooksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const { books, loading, error } = useBooks({
    search: searchTerm || undefined,
    genre: selectedGenre || undefined,
  });

  const handleBookClick = (book: Book) => {
    console.log("Clicked book:", book.name);
  };

  const genres = [...new Set(books.map((b) => b.genre))];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Все книги</h1>
          <p className="text-gray-500 mt-1">
            {loading ? "Загрузка..." : `Найдено книг: ${books.length}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            placeholder="🔍 Поиск по названию или автору..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все жанры</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>

          {(searchTerm || selectedGenre) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedGenre("");
              }}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition"
            >
              ✕ Сбросить
            </button>
          )}
        </div>

        <BookList
          books={books}
          loading={loading}
          error={error}
          onBookClick={handleBookClick}
        />
      </div>
    </main>
  );
}
