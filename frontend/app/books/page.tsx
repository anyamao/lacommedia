"use client";

import { useState, useMemo } from "react";
import { useBooks } from "@/hooks/useBooks";
import BookList from "@/components/books/BookList";
import { Book } from "@/lib/api/types";
import { useDebounce } from "@/hooks/useDebounce";

export default function BooksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("-created_at");
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // ✅ Строим фильтры для API
  const filters = useMemo(() => {
    const f: any = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (selectedGenres.length > 0) f.genre__in = selectedGenres.join(",");
    if (selectedAuthors.length > 0) f.author__in = selectedAuthors.join(",");
    if (selectedCountries.length > 0)
      f.country__in = selectedCountries.join(",");
    if (sortBy) f.ordering = sortBy;
    return f;
  }, [
    debouncedSearch,
    selectedGenres,
    selectedAuthors,
    selectedCountries,
    sortBy,
  ]);

  const { books, loading, error } = useBooks(filters);

  // Собираем уникальные значения для фильтров из ВСЕХ книг (не только отфильтрованных)
  // Для этого нужен отдельный запрос без фильтров, но пока используем то что есть
  const allBooks = books; // В идеале нужен отдельный запрос для получения всех уникальных значений

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    allBooks.forEach((b: Book) => {
      if (b.genre) genres.add(b.genre);
    });
    return Array.from(genres).sort();
  }, [allBooks]);

  const availableAuthors = useMemo(() => {
    const authors = new Set<string>();
    allBooks.forEach((b: Book) => {
      if (b.author) authors.add(b.author);
    });
    return Array.from(authors).sort();
  }, [allBooks]);

  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    allBooks.forEach((b: Book) => {
      if (b.country) countries.add(b.country);
    });
    return Array.from(countries).sort();
  }, [allBooks]);

  const toggleFilter = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
  ) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleBookClick = (book: Book) => {
    window.location.href = `/books/${book.id}`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">📚 Все книги</h1>
          <p className="text-gray-500 mt-1">
            {loading ? "Загрузка..." : `Найдено книг: ${books.length}`}
          </p>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {/* Поле поиска */}
            <input
              type="text"
              placeholder="🔍 Поиск по названию или автору..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Сортировка */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="-created_at">📅 Новые сначала</option>
              <option value="created_at">📅 Старые сначала</option>
              <option value="-hours_to_read">⏱️ Часов: от большего</option>
              <option value="hours_to_read">⏱️ Часов: от меньшего</option>
              <option value="-year">📆 Новые по году</option>
              <option value="year">📆 Старые по году</option>
              <option value="-rating">⭐ Рейтинг: высокий</option>
              <option value="rating">⭐ Рейтинг: низкий</option>
              <option value="name">🔤 По названию (А-Я)</option>
              <option value="-name">🔤 По названию (Я-А)</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              {showFilters ? "✕ Скрыть фильтры" : "⚙️ Фильтры"}
            </button>

            {(selectedGenres.length > 0 ||
              selectedAuthors.length > 0 ||
              selectedCountries.length > 0) && (
              <button
                onClick={() => {
                  setSelectedGenres([]);
                  setSelectedAuthors([]);
                  setSelectedCountries([]);
                }}
                className="px-4 py-2 text-red-500 hover:text-red-700 transition"
              >
                ✕ Сбросить все фильтры
              </button>
            )}
          </div>

          {/* Фильтры */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
              {/* Фильтр по жанрам */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Жанры ({selectedGenres.length})
                </label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {availableGenres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() =>
                        toggleFilter(genre, setSelectedGenres, selectedGenres)
                      }
                      className={`px-2 py-1 text-xs rounded-full transition ${
                        selectedGenres.includes(genre)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Фильтр по авторам */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Авторы ({selectedAuthors.length})
                </label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {availableAuthors.map((author) => (
                    <button
                      key={author}
                      onClick={() =>
                        toggleFilter(
                          author,
                          setSelectedAuthors,
                          selectedAuthors,
                        )
                      }
                      className={`px-2 py-1 text-xs rounded-full transition ${
                        selectedAuthors.includes(author)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {author}
                    </button>
                  ))}
                </div>
              </div>

              {/* Фильтр по странам */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Страны ({selectedCountries.length})
                </label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {availableCountries.map((country) => (
                    <button
                      key={country}
                      onClick={() =>
                        toggleFilter(
                          country,
                          setSelectedCountries,
                          selectedCountries,
                        )
                      }
                      className={`px-2 py-1 text-xs rounded-full transition ${
                        selectedCountries.includes(country)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Список книг */}
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
