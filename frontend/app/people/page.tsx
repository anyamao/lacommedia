"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import { useDebounce } from "@/hooks/useDebounce";

interface Person {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  image_url: string | null;
  occupation: string;
  birth_country: string;
  is_alive: boolean;
  related_content_count: number;
  date_of_birth: string | null;
  date_of_death: string | null;
}

const occupationLabels: Record<string, string> = {
  writer: "✍️ Писатель",
  director: "🎬 Режиссёр",
  artist: "🎨 Художник",
  composer: "🎵 Композитор",
  actor: "🎭 Актёр",
  other: "📌 Другое",
};

const occupationEmojis: Record<string, string> = {
  writer: "✍️",
  director: "🎬",
  artist: "🎨",
  composer: "🎵",
  actor: "🎭",
  other: "📌",
};

export default function PeoplePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOccupation, setSelectedOccupation] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("last_name");

  const debouncedSearch = useDebounce(searchTerm, 500);

  // ✅ Правильный URL: /api/v1/people/ (не /content/people/)
  const url = `/people/?search=${debouncedSearch || ""}${selectedOccupation ? `&occupation=${selectedOccupation}` : ""}&ordering=${sortBy}`;

  const {
    data: people,
    isLoading,
    error,
  } = useSWR(url, () => apiClient.get(url));

  const occupations = useMemo(() => {
    const occs = new Set<string>();
    if (people) {
      people.forEach((p: Person) => {
        if (p.occupation) occs.add(p.occupation);
      });
    }
    return Array.from(occs);
  }, [people]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Ошибка загрузки</p>
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
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">👥 Люди</h1>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="🔍 Поиск по имени..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={selectedOccupation}
              onChange={(e) => setSelectedOccupation(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все профессии</option>
              {occupations.map((occ) => (
                <option key={occ} value={occ}>
                  {occupationLabels[occ] || occ}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last_name">🔤 По фамилии</option>
              <option value="-created_at">📅 Новые сначала</option>
              <option value="created_at">📅 Старые сначала</option>
            </select>
          </div>
        </div>

        {/* Список людей */}
        {people?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-2xl text-gray-400">👤</p>
            <p className="text-gray-500 mt-2">Люди не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {people?.map((person: Person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition hover:-translate-y-1"
              >
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                  {person.image_url ? (
                    <img
                      src={person.image_url}
                      alt={person.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl text-gray-400">
                      {occupationEmojis[person.occupation] || "👤"}
                    </span>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                    {person.is_alive ? "Жив" : "Ушёл из жизни"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 truncate">
                    {person.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {occupationLabels[person.occupation] || person.occupation}
                  </p>
                  {person.birth_country && (
                    <p className="text-sm text-gray-400">
                      🌍 {person.birth_country}
                    </p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">
                    📚 {person.related_content_count} работ
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
