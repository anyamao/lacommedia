"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { ActionButtons } from "@/components/interactions/ActionButtons";
import { CommentSection } from "@/components/interactions/CommentSection";

export default function CoursePromoPage() {
  const params = useParams();
  const id = parseInt(params.id as string);

  const {
    data: course,
    isLoading,
    error,
  } = useSWR(`/courses/${id}/`, () => apiClient.get(`/courses/${id}/`));

  const { data: progress } = useSWR(`/courses/${id}/progress/`, () =>
    apiClient.get(`/courses/${id}/progress/`).catch(() => null),
  );

  // ✅ Добавляем загрузку последних курсов
  const { data: latestCourses } = useSWR(
    "/courses/?ordering=-created_at&limit=6",
    () => apiClient.get("/courses/?ordering=-created_at&limit=6"),
  );

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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована!");
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      alert("Ссылка скопирована!");
    }
  };

  const completedLessons = progress?.completed_lessons || 0;
  const totalLessons = progress?.total_lessons || course.lessons?.length || 0;
  const completionPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <Link
            href="/courses"
            className="text-blue-600 hover:underline inline-block"
          >
            ← Все курсы
          </Link>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm"
          >
            📤 Поделиться
          </button>
        </div>

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
                {progress?.is_completed && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    ✅ Пройден
                  </span>
                )}
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

              <div className="mt-2 text-sm text-gray-400">
                <span>📅 Создан: {formatDate(course.created_at)}</span>
                {course.updated_at !== course.created_at && (
                  <span className="ml-4">
                    🔄 Обновлен: {formatDate(course.updated_at)}
                  </span>
                )}
              </div>

              <p className="mt-4 text-gray-700 leading-relaxed">
                {course.description}
              </p>

              {/* Прогресс */}
              {progress && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Прогресс курса</span>
                    <span className="text-gray-500">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-500 ${
                        completionPercentage >= 75
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6">
                <ActionButtons
                  content_type="content.course"
                  object_id={course.id}
                />
              </div>

              <Link
                href={`/courses/${course.id}`}
                className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                🎓 Начать учиться
              </Link>
            </div>
          </div>
        </div>

        {/* Список уроков */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">📚 Уроки курса</h2>
          <div className="space-y-3">
            {course.lessons?.map((lesson: any, index: number) => {
              const isCompleted =
                progress?.lessons?.find((l: any) => l.lesson_id === lesson.id)
                  ?.is_completed || false;
              return (
                <div
                  key={lesson.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isCompleted
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-medium">{lesson.title}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ⏱️ {lesson.duration} мин
                      </span>
                    </div>
                  </div>
                  {isCompleted && (
                    <span className="text-green-600 text-sm font-medium">
                      ✅ Пройдено
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Комментарии */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <CommentSection content_type="content.course" object_id={course.id} />
        </div>

        {/* ✅ Последние курсы */}
        {latestCourses && latestCourses.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🆕 Последние курсы
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestCourses
                .filter((c: any) => c.id !== course.id)
                .slice(0, 6)
                .map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}/promo`}
                    className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition flex items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded flex items-center justify-center text-2xl flex-shrink-0">
                      {c.cover_url ? (
                        <img
                          src={c.cover_url}
                          alt={c.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        "📚"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{c.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.topic}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.lessons_count} уроков
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
