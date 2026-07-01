"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";

export default function CoursePromoPage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  // ✅ Правильный URL: /courses/{id}/
  const {
    data: course,
    isLoading,
    error,
  } = useSWR(`/courses/${id}/`, () => apiClient.get(`/courses/${id}/`));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Курс не найден</p>
          <Link
            href="/courses"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            ← Все курсы
          </Link>
        </div>
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/courses"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Все курсы
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
              {course.cover_url ? (
                <img
                  src={course.cover_url}
                  alt={course.title}
                  className="w-full max-h-96 object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-6xl text-gray-300">
                  📚
                </div>
              )}
            </div>

            <div className="md:w-2/3 p-6 md:p-8">
              <h1 className="text-3xl font-bold text-gray-800">
                {course.title}
              </h1>
              <p className="text-gray-600 mt-1">{course.topic}</p>

              <div className="flex flex-wrap gap-4 mt-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  📚 {course.lessons_count} уроков
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  ⏱️ {formatTime(course.total_time)}
                </span>
              </div>

              {course.authors && course.authors.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Авторы: </span>
                  {course.authors.map((author: string, idx: number) => (
                    <span key={idx} className="text-sm font-medium">
                      {author}
                      {idx < course.authors.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-4 text-gray-700">{course.description}</p>

              <Link
                href={`/courses/${course.id}`}
                className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                🎓 Начать учиться
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
