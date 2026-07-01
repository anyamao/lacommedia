"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { QuizSection } from "@/components/books/QuizSection";

export default function CoursePage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <Link
            href={`/courses/${id}/promo`}
            className="text-blue-600 hover:underline"
          >
            ← Информация о курсе
          </Link>
          <Link href="/courses" className="text-blue-600 hover:underline">
            Все курсы →
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">{course.title}</h1>

        {/* Уроки */}
        <div className="space-y-4">
          {course.lessons?.map((lesson: any, index: number) => (
            <div
              key={lesson.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedLesson(
                    expandedLesson === lesson.id ? null : lesson.id,
                  )
                }
                className="w-full text-left p-4 hover:bg-gray-50 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <p className="text-sm text-gray-500">
                      ⏱️ {lesson.duration} мин
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">
                  {expandedLesson === lesson.id ? "▲" : "▼"}
                </span>
              </button>

              {expandedLesson === lesson.id && (
                <div className="p-4 border-t">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {lesson.content}
                    </p>
                  </div>

                  {lesson.quiz_questions &&
                    lesson.quiz_questions.length > 0 && (
                      <div className="mt-4">
                        <QuizSection
                          contentId={lesson.id}
                          questions={lesson.quiz_questions}
                          title="📝 Тест по уроку"
                        />
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
