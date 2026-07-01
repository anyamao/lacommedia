"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { ActionButtons } from "@/components/interactions/ActionButtons";
import { CommentSection } from "@/components/interactions/CommentSection";

interface Person {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  image_url: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  is_alive: boolean;
  birth_country: string;
  occupation: string;
  biography: string;
  interesting_facts: { title: string; fact: string }[];
  related_content_count: number;
  related_content: any[];
}

const occupationLabels: Record<string, string> = {
  writer: "✍️ Писатель",
  director: "🎬 Режиссёр",
  artist: "🎨 Художник",
  composer: "🎵 Композитор",
  actor: "🎭 Актёр",
  other: "📌 Другое",
};

const typeEmojis: Record<string, string> = {
  book: "📚",
  movie: "🎬",
  painting: "🖼️",
  music: "🎵",
  article: "📄",
};

const typePaths: Record<string, string> = {
  book: "books",
  movie: "movies",
  painting: "paintings",
  music: "music",
  article: "articles",
};

// ✅ Fetcher
const fetcher = <T,>(url: string): Promise<T> => apiClient.get<T>(url);

export default function PersonDetailPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const { showToast } = useToast();

  const {
    data: person,
    isLoading,
    error,
  } = useSWR<Person>(`/people/${id}/`, fetcher<Person>);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Человек не найден</p>
          <Link
            href="/people"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            ← Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getAge = () => {
    if (!person.date_of_birth) return "";
    const birth = new Date(person.date_of_birth);
    const end = person.date_of_death
      ? new Date(person.date_of_death)
      : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/people"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Все люди
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Шапка */}
          <div className="md:flex bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="md:w-1/3 flex items-center justify-center p-6">
              {person.image_url ? (
                <img
                  src={person.image_url}
                  alt={person.full_name}
                  className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-48 h-48 rounded-full bg-white/20 flex items-center justify-center text-white text-6xl border-4 border-white">
                  {person.first_name?.[0] || "?"}
                </div>
              )}
            </div>
            <div className="md:w-2/3 p-6 text-white">
              <h1 className="text-3xl font-bold">{person.full_name}</h1>
              <p className="text-blue-100 text-lg">
                {occupationLabels[person.occupation] || person.occupation}
              </p>
              {person.birth_country && (
                <p className="text-blue-100">🌍 {person.birth_country}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2">
                {person.date_of_birth && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    📅 Родился: {formatDate(person.date_of_birth)}
                  </span>
                )}
                {person.date_of_death ? (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    ⚰️ Ушёл: {formatDate(person.date_of_death)} (в возрасте{" "}
                    {getAge()} лет)
                  </span>
                ) : (
                  <span className="bg-green-500/30 px-3 py-1 rounded-full text-sm">
                    ✅ Жив ({getAge()} лет)
                  </span>
                )}
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  📚 {person.related_content_count} работ
                </span>
              </div>
            </div>
          </div>

          {/* Контент */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Биография */}
            {person.biography && (
              <div>
                <h2 className="text-xl font-semibold mb-3">📖 Биография</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {person.biography}
                </p>
              </div>
            )}

            {/* Интересные факты */}
            {person.interesting_facts &&
              person.interesting_facts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    💡 Интересные факты
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {person.interesting_facts.map((fact, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
                      >
                        <h3 className="font-semibold text-blue-800 text-sm mb-1">
                          {fact.title}
                        </h3>
                        <p className="text-gray-700 text-sm">{fact.fact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Связанные работы */}
            {person.related_content && person.related_content.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">
                  📚{" "}
                  {person.occupation === "writer"
                    ? "Книги"
                    : person.occupation === "director"
                      ? "Фильмы"
                      : person.occupation === "artist"
                        ? "Картины"
                        : person.occupation === "composer"
                          ? "Музыка"
                          : "Работы"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {person.related_content.map((item: any) => {
                    const typePath =
                      item.content_type === "book"
                        ? "books"
                        : item.content_type === "movie"
                          ? "movies"
                          : item.content_type === "painting"
                            ? "paintings"
                            : item.content_type === "music"
                              ? "music"
                              : "articles";
                    return (
                      <Link
                        key={item.id}
                        href={`/${typePath}/${item.id}`}
                        className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition flex items-center gap-3"
                      >
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                          {item.cover_url ? (
                            <img
                              src={item.cover_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            typeEmojis[item.content_type] || "📄"
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">{item.genre}</p>
                          {item.year && (
                            <p className="text-xs text-gray-400">{item.year}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {person.related_content_count > 6 && (
                  <Link
                    href={`/people/${person.id}/content`}
                    className="text-blue-600 hover:underline mt-3 inline-block text-sm"
                  >
                    Показать все {person.related_content_count} работ →
                  </Link>
                )}
              </div>
            )}

            {/* Действия */}
            <div className="border-t pt-4">
              <ActionButtons
                content_type="content.person"
                object_id={person.id}
              />
            </div>

            {/* Комментарии */}
            <div className="border-t pt-4">
              <CommentSection
                content_type="content.person"
                object_id={person.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
