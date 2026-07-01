"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import { useDebounce } from "@/hooks/useDebounce";

interface Course {
  id: number;
  title: string;
  description: string;
  cover_url: string | null;
  topic: string;
  authors: string[];
  total_time: number;
  lessons_count: number;
  created_at: string;
  is_completed?: boolean;
}

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("-created_at");

  const debouncedSearch = useDebounce(searchTerm, 500);

  // ✅ Правильный URL: /courses/ (не /content/courses/)
  const url = `/courses/?search=${debouncedSearch || ""}${selectedTopic ? `&topic=${selectedTopic}` : ""}&ordering=${sortBy}`;

  const {
    data: courses,
    isLoading,
    error,
  } = useSWR(url, () => apiClient.get(url));

  const topics = useMemo(() => {
    const t = new Set<string>();
    if (courses) {
      courses.forEach((c: Course) => {
        if (c.topic) t.add(c.topic);
      });
    }
    return Array.from(t);
  }, [courses]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  };

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
        <h1 className="text-3xl font-bold mb-6">🎓 Курсы</h1>

        {/* Поиск и фильтры */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="🔍 Поиск курсов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все темы</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="-created_at">📅 Новые сначала</option>
              <option value="created_at">📅 Старые сначала</option>
              <option value="title">🔤 По названию</option>
              <option value="-total_time">⏱️ Долгие сначала</option>
              <option value="total_time">⏱️ Короткие сначала</option>
            </select>
          </div>
        </div>

        {/* Список курсов */}
        {courses?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-2xl text-gray-400">🎓</p>
            <p className="text-gray-500 mt-2">Курсы не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course: Course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}/promo`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition hover:-translate-y-1"
              >
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative">
                  {course.cover_url ? (
                    <img
                      src={course.cover_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl text-gray-300">📚</span>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                    {course.lessons_count} уроков ·{" "}
                    {formatTime(course.total_time)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 truncate">
                    {course.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 truncate">
                      {course.title}
                    </h3>
                    {course.is_completed && (
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                        ✅ Пройден
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {course.topic}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {course.authors.map((author, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                      >
                        {author}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
