"use client";

import { useRouter } from "next/navigation";
import { Book } from "@/lib/api/types";

interface BookCardProps {
  book: Book;
  onClick?: (book: Book) => void; // ✅ Добавляем проп
}

export default function BookCard({ book, onClick }: BookCardProps) {
  const router = useRouter();
  const coverUrl = book.cover ? `https://lacomedia.ru${book.cover}` : null;

  const handleClick = () => {
    if (onClick) {
      onClick(book);
    } else {
      router.push(`/books/${book.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
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

        <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
          <span>⭐</span>
          {book.rating}
        </div>

        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs">
          👁️ {book.views_count || 0}
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
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{book.description}</p>
      </div>
    </div>
  );
}
