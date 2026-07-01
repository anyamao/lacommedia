"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { QuizSection } from "@/components/books/QuizSection";
import { useToast } from "@/context/ToastContext";

export default function CoursePage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const { showToast } = useToast();

  const {
    data: course,
    isLoading,
    error,
    mutate,
  } = useSWR(`/courses/${id}/`, () => apiClient.get(`/courses/${id}/`));

  const { data: progressData, mutate: mutateProgress } = useSWR(
    `/courses/${id}/progress/`,
    () => apiClient.get(`/courses/${id}/progress/`).catch(() => null),
  );

  const { data: latestCourses } = useSWR(
    "/courses/?ordering=-created_at&limit=6",
    () => apiClient.get("/courses/?ordering=-created_at&limit=6"),
  );

  useEffect(() => {
    if (progressData) {
      setProgress(progressData);
    }
  }, [progressData]);

  useEffect(() => {
    if (course?.lessons?.length > 0 && selectedLessonId === null) {
      setSelectedLessonId(course.lessons[0].id);
    }
  }, [course, selectedLessonId]);

  const selectedLesson = course?.lessons?.find(
    (l: any) => l.id === selectedLessonId,
  );

  const handleLessonComplete = async (score: number, passed: boolean) => {
    try {
      const result = await apiClient.post(`/courses/${id}/complete_lesson/`, {
        lesson_id: selectedLessonId,
        score: score,
      });

      setProgress(result);
      mutateProgress();
      mutate();

      if (result.course_completed_now) {
        showToast("🎉 Поздравляем! Вы прошли весь курс!", "success");
      } else if (passed && result.lesson_completed) {
        showToast("✅ Урок пройден!", "success");
      } else if (passed && !result.lesson_completed) {
        showToast("✅ Тест пройден! (урок уже был пройден)", "info");
      } else {
        showToast("❌ Попробуйте пройти тест еще раз (нужно 75%)", "error");
      }
    } catch (error) {
      console.error("Error completing lesson:", error);
      showToast("Ошибка при сохранении результата", "error");
    }
  };

  const handleShareLesson = async (lessonId: number) => {
    const url = `${window.location.origin}/courses/${id}?lesson=${lessonId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("🔗 Ссылка на урок скопирована!", "success");
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      showToast("🔗 Ссылка на урок скопирована!", "success");
    }
  };

  const isLessonCompleted = (lessonId: number) => {
    if (!progress?.lessons) return false;
    const lesson = progress.lessons.find((l: any) => l.lesson_id === lessonId);
    return lesson?.is_completed || false;
  };

  const getLessonScore = (lessonId: number) => {
    if (!progress?.lessons) return 0;
    const lesson = progress.lessons.find((l: any) => l.lesson_id === lessonId);
    return lesson?.score || 0;
  };

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

  const completedLessons = progress?.completed_lessons || 0;
  const totalLessons = progress?.total_lessons || course.lessons?.length || 0;
  const completionPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (!course.lessons || course.lessons.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/courses" className="text-blue-600 hover:underline">
            ← Все курсы
          </Link>
          <div className="mt-8 bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-2xl text-gray-400">📚</p>
            <p className="text-gray-500 mt-2">В этом курсе пока нет уроков</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Шапка */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link
              href={`/courses/${id}/promo`}
              className="text-blue-600 hover:underline text-sm"
            >
              ← Информация о курсе
            </Link>
            <h1 className="text-2xl font-bold mt-1">{course.title}</h1>
          </div>
          <Link
            href="/courses"
            className="text-blue-600 hover:underline text-sm"
          >
            Все курсы →
          </Link>
        </div>

        {/* Полоска прогресса */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Прогресс курса
            </span>
            <span className="text-sm text-gray-500">
              {completedLessons} из {totalLessons} уроков (
              {completionPercentage}%)
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                completionPercentage >= 75 ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {progress?.is_completed && (
            <div className="mt-2 text-green-600 font-semibold text-sm">
              ✅ Курс пройден!{" "}
              {progress.completed_at &&
                `(${new Date(progress.completed_at).toLocaleDateString("ru-RU")})`}
            </div>
          )}
        </div>

        {/* Двухколоночный макет */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Левая колонка — список уроков */}
          <div className="md:w-1/3 lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
                Уроки ({course.lessons?.length || 0})
              </h2>
              <div className="space-y-1">
                {course.lessons?.map((lesson: any, index: number) => {
                  const completed = isLessonCompleted(lesson.id);
                  const score = getLessonScore(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between cursor-pointer ${
                        selectedLessonId === lesson.id
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => setSelectedLessonId(lesson.id)}
                    >
                      <span className="truncate flex items-center gap-2">
                        {completed && (
                          <span className="text-green-500">✅</span>
                        )}
                        {index + 1}. {lesson.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareLesson(lesson.id);
                          }}
                          className={`text-xs cursor-pointer transition ${
                            selectedLessonId === lesson.id
                              ? "text-blue-200 hover:text-white"
                              : "text-gray-400 hover:text-blue-600"
                          }`}
                        >
                          📤
                        </span>
                        {score > 0 && (
                          <span
                            className={`text-xs ${
                              selectedLessonId === lesson.id
                                ? "text-blue-200"
                                : "text-gray-400"
                            }`}
                          >
                            {score}%
                          </span>
                        )}
                        <span
                          className={`text-xs ${
                            selectedLessonId === lesson.id
                              ? "text-blue-200"
                              : "text-gray-400"
                          }`}
                        >
                          {lesson.duration} мин
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Правая колонка — текущий урок */}
          <div className="md:w-2/3 lg:w-3/4">
            {selectedLesson ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedLesson.title}
                    </h2>
                    <p className="text-sm text-gray-500">
                      ⏱️ {selectedLesson.duration} минут
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareLesson(selectedLesson.id)}
                      className="text-gray-400 hover:text-blue-600 transition text-sm px-2 py-1 border border-gray-200 rounded-lg hover:border-blue-200"
                    >
                      📤 Поделиться
                    </button>
                    {isLessonCompleted(selectedLesson.id) && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ✅ Пройдено
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                      Урок {course.lessons.indexOf(selectedLesson) + 1} из{" "}
                      {course.lessons.length}
                    </span>
                  </div>
                </div>

                {/* Содержание урока */}
                <div className="prose max-w-none">
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedLesson.content}
                  </div>
                </div>

                {/* Тест к уроку */}
                {selectedLesson.quiz_questions &&
                  selectedLesson.quiz_questions.length > 0 && (
                    <div className="mt-6 border-t pt-6">
                      <QuizSection
                        contentId={selectedLesson.id}
                        questions={selectedLesson.quiz_questions}
                        title="📝 Тест по уроку"
                        onComplete={handleLessonComplete}
                        disabled={isLessonCompleted(selectedLesson.id)}
                      />
                    </div>
                  )}

                {/* Кнопки навигации */}
                <div className="mt-6 flex justify-between border-t pt-4">
                  <button
                    onClick={() => {
                      const currentIndex = course.lessons.findIndex(
                        (l: any) => l.id === selectedLesson.id,
                      );
                      if (currentIndex > 0) {
                        setSelectedLessonId(
                          course.lessons[currentIndex - 1].id,
                        );
                      }
                    }}
                    disabled={course.lessons.indexOf(selectedLesson) === 0}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Предыдущий
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = course.lessons.findIndex(
                        (l: any) => l.id === selectedLesson.id,
                      );
                      if (currentIndex < course.lessons.length - 1) {
                        setSelectedLessonId(
                          course.lessons[currentIndex + 1].id,
                        );
                      }
                    }}
                    disabled={
                      course.lessons.indexOf(selectedLesson) ===
                      course.lessons.length - 1
                    }
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Следующий →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
                Выберите урок из списка слева
              </div>
            )}
          </div>
        </div>

        {/* Последние курсы */}
      </div>
    </div>
  );
}
