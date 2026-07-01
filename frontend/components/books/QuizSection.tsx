"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
}

interface QuizProps {
  contentId: number;
  questions: QuizQuestion[];
  title?: string;
  onComplete?: (score: number, passed: boolean) => void;
  disabled?: boolean;
}

export function QuizSection({
  contentId,
  questions,
  title = "🧠 Тест",
  onComplete,
  disabled = false,
}: QuizProps) {
  // ✅ Добавляем key для сброса состояния при смене урока
  const [resetKey, setResetKey] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const hasQuestions = questions && questions.length > 0;

  // ✅ Сбрасываем состояние при изменении contentId
  useEffect(() => {
    setResetKey((prev) => prev + 1);
    setQuizStarted(false);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setIsCompleted(false);
    setIsSubmitting(false);
  }, [contentId]);

  const startQuiz = () => {
    setQuizStarted(true);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
    setIsCompleted(false);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResults || disabled || isCompleted || isSubmitting) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Подсчет результатов
      let correct = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correct_answer) {
          correct++;
        }
      });
      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= 75;

      setShowResults(true);
      setIsCompleted(true);

      // Вызываем callback
      if (onComplete) {
        setIsSubmitting(true);
        onComplete(score, passed);
        setIsSubmitting(false);
      }
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_answer) {
        correct++;
      }
    });
    return correct;
  };

  if (!hasQuestions) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">Для этого урока пока нет теста</p>
      </div>
    );
  }

  if (disabled && isCompleted) {
    return (
      <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-600 font-semibold">✅ Тест пройден!</p>
        <p className="text-sm text-green-500">Вы уже завершили этот тест.</p>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="text-center py-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">
          В тесте {questions.length} вопросов. Для прохождения нужно набрать
          75%.
        </p>
        <button
          onClick={startQuiz}
          disabled={disabled}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
        >
          Начать тест
        </button>
      </div>
    );
  }

  if (showResults) {
    const correct = getScore();
    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);
    const isPassed = percentage >= 75;

    return (
      <div>
        <div
          className={`text-center py-4 border-b mb-4 rounded-lg ${
            isPassed
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <h3 className="text-xl font-bold mb-1">
            {isPassed
              ? "🎉 Отлично! Тест пройден!"
              : "📚 Нужно больше практики!"}
          </h3>
          <p className="text-base">
            Правильных ответов:{" "}
            <span className="font-bold text-blue-600">{correct}</span> из{" "}
            {total}
          </p>
          <p
            className={`text-sm font-semibold ${isPassed ? "text-green-600" : "text-red-600"}`}
          >
            {percentage}%{" "}
            {isPassed ? "✅ Пройдено" : "❌ Не пройдено (нужно 75%)"}
          </p>
          {!isPassed && (
            <button
              onClick={startQuiz}
              className="mt-3 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Попробовать снова
            </button>
          )}
          {isPassed && onComplete && isSubmitting && (
            <p className="text-sm text-gray-500 mt-2">
              Сохранение результата...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Текущий вопрос
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = selectedAnswers[currentQuestionIndex];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </span>
          <div className="flex gap-0.5">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToQuestion(idx)}
                className={`w-6 h-6 rounded-full text-[10px] font-medium transition ${
                  idx === currentQuestionIndex
                    ? "bg-blue-600 text-white"
                    : selectedAnswers[idx] !== -1
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {selectedAnswers.filter((a) => a !== -1).length} / {questions.length}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-base font-medium text-gray-800 mb-3">
          {currentQuestion.question}
        </h4>
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = currentAnswer === idx;
            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:bg-gray-100"
                }`}
              >
                <span className="font-medium text-gray-500 mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>
        <button
          onClick={goToNextQuestion}
          disabled={isSubmitting}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {currentQuestionIndex === questions.length - 1
            ? "📊 Результат"
            : "Далее →"}
        </button>
      </div>
    </div>
  );
}
