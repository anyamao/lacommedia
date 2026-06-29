"use client";

import { Book } from "@/lib/api/types";

interface BookCardProps {
  book: Book;
  onClick?: (book: Book) => void;
}

export default function BookCard({ book, onClick }: BookCardProps) {
  const coverUrl = book.cover ? `http://localhost:8000${book.cover}` : null;

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
      onClick={() => onClick?.(book)}
    >
      {/* Обложка */}
      <div className="h-52 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-6xl text-gray-300">📖</span>
        )}

        {/* Рейтинг на обложке */}
        <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
          <span>⭐</span>
          {book.rating}
        </div>
      </div>

      {/* Информация */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 truncate">
          {book.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">✍️ {book.author}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
            {book.genre}
          </span>
          <span className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">
            {book.year}
          </span>
          {book.country && (
            <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
              🌍 {book.country}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{book.description}</p>
      </div>
    </div>
  );
}
