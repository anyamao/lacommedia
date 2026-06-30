"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useContentList } from "@/hooks/useContent";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

// ✅ Определяем тип из пути
const getContentTypeFromPath = (pathname: string): string => {
  if (pathname.startsWith("/books")) return "book";
  if (pathname.startsWith("/movies")) return "movie";
  if (pathname.startsWith("/paintings")) return "painting";
  if (pathname.startsWith("/music")) return "music";
  return "book";
};

// ✅ Определяем путь для ссылок
const getTypePath = (pathname: string): string => {
  if (pathname.startsWith("/books")) return "books";
  if (pathname.startsWith("/movies")) return "movies";
  if (pathname.startsWith("/paintings")) return "paintings";
  if (pathname.startsWith("/music")) return "music";
  return "books";
};

const typeLabels: Record<string, string> = {
  book: "Книги",
  movie: "Фильмы",
  painting: "Картины",
  music: "Музыка",
};

const typeEmojis: Record<string, string> = {
  book: "📚",
  movie: "🎬",
  painting: "🖼️",
  music: "🎵",
};

export default function ContentListPage() {
  const pathname = usePathname();

  // ✅ Определяем тип из URL
  const contentType = getContentTypeFromPath(pathname);
  const typePath = getTypePath(pathname);

  // ✅ Отладка
  console.log("🔍 pathname:", pathname);
  console.log("🔍 contentType:", contentType);
  console.log("🔍 typePath:", typePath);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("-created_at");
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filters = useMemo(() => {
    const f: any = {};

    if (contentType) {
      f.content_type = contentType;
    }

    if (debouncedSearch) f.search = debouncedSearch;
    if (selectedGenres.length > 0) f.genre__in = selectedGenres.join(",");
    if (selectedCountries.length > 0)
      f.country__in = selectedCountries.join(",");
    if (sortBy) f.ordering = sortBy;

    return f;
  }, [contentType, debouncedSearch, selectedGenres, selectedCountries, sortBy]);

  const { content, isLoading, error } = useContentList(filters);

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    content.forEach((c: any) => {
      if (c.genre) genres.add(c.genre);
    });
    return Array.from(genres).sort();
  }, [content]);

  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    content.forEach((c: any) => {
      if (c.country) countries.add(c.country);
    });
    return Array.from(countries).sort();
  }, [content]);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Ошибка загрузки</p>
          <p className="text-gray-500">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            {typeEmojis[contentType]} {typeLabels[contentType]}
          </h1>
          <p className="text-gray-500 mt-1">
            {isLoading ? "Загрузка..." : `Найдено: ${content.length}`}
          </p>
        </div>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder={`🔍 Поиск по ${typeLabels[contentType].toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="-created_at">📅 Новые сначала</option>
              <option value="created_at">📅 Старые сначала</option>
              <option value="-rating">⭐ Рейтинг: высокий</option>
              <option value="rating">⭐ Рейтинг: низкий</option>
              <option value="title">🔤 По названию (А-Я)</option>
              <option value="-title">🔤 По названию (Я-А)</option>
              <option value="-year">📆 Новые по году</option>
              <option value="year">📆 Старые по году</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              {showFilters ? "✕ Скрыть" : "⚙️ Фильтры"}
            </button>

            {(selectedGenres.length > 0 || selectedCountries.length > 0) && (
              <button
                onClick={() => {
                  setSelectedGenres([]);
                  setSelectedCountries([]);
                }}
                className="px-4 py-2 text-red-500 hover:text-red-700 transition"
              >
                ✕ Сбросить
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Жанры ({availableGenres.length})
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

        {/* Список карточек */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
              >
                <div className="h-52 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl text-gray-400">Ничего не найдено</p>
            <p className="text-gray-500 mt-2">Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content.map((item: any) => (
              <Link
                key={item.id}
                href={`/${typePath}/${item.id}`} // ✅ Используем typePath
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-52 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
                  {item.cover_url ? (
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-6xl text-gray-300">
                      {typeEmojis[item.content_type]}
                    </span>
                  )}
                  <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    ⭐ {item.rating}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{item.genre}</p>
                  {item.year && (
                    <p className="text-sm text-gray-500">{item.year}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {item.short_description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
