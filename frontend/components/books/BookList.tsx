"use client";

import { Book } from "@/lib/api/types";
import BookCard from "./BookCard";
import BookSkeleton from "./BookSkeleton";

interface BookListProps {
  books: Book[];
  loading: boolean;
  error: string | null; // ✅ string | null
  onBookClick?: (book: Book) => void;
}

export default function BookList({
  books,
  loading,
  error,
  onBookClick,
}: BookListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <BookSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg">❌ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-2xl font-semibold text-gray-600">
          Книги не найдены
        </h3>
        <p className="text-gray-400 mt-2">Попробуйте изменить фильтры</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onClick={onBookClick} />
      ))}
    </div>
  );
}
