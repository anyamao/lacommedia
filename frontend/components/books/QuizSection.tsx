"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/lib/api/client";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
}

interface QuizProps {
  bookId: number;
}

export function QuizSection({ bookId }: QuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const { showToast } = useToast();

  // Загружаем вопросы (пока заглушка, позже можно добавить API)
  useEffect(() => {
    // TODO: Загружать вопросы с бэкенда
    // Пока используем заглушку для демонстрации
    const mockQuestions: Question[] = [
      {
        id: 1,
        question: 'Кто написал "Войну и мир"?',
        options: ["Достоевский", "Толстой", "Пушкин", "Чехов"],
        correct_answer: 1,
      },
      {
        id: 2,
        question: "В каком году была опубликована книга?",
        options: ["1865", "1869", "1873", "1860"],
        correct_answer: 1,
      },
      {
        id: 3,
        question: 'Сколько томов в "Войне и мире"?',
        options: ["3", "4", "5", "6"],
        correct_answer: 1,
      },
    ];
    setQuestions(mockQuestions);
    setSelectedAnswers(new Array(mockQuestions.length).fill(-1));
    setLoading(false);
  }, [bookId]);

  const startQuiz = () => {
    setQuizStarted(true);
    setShowResults(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(questions.length).fill(-1));
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResults) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
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

  if (loading) {
    return (
      <div className="text-gray-500 text-center py-8">Загрузка теста...</div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-3">🧠 Тест по книге</h3>
        <p className="text-gray-600 mb-4">
          Проверьте свои знания! В тесте {questions.length} вопросов.
        </p>
        <button
          onClick={startQuiz}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Начать тест
        </button>
      </div>
    );
  }

  if (showResults) {
    const score = getScore();
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);
    const isPassed = percentage >= 70;

    return (
      <div>
        <div className="text-center py-6 border-b mb-6">
          <h3 className="text-2xl font-bold mb-2">
            {isPassed ? "🎉 Отлично!" : "📚 Попробуйте еще раз!"}
          </h3>
          <p className="text-lg">
            Правильных ответов:{" "}
            <span className="font-bold text-blue-600">{score}</span> из {total}
          </p>
          <p className="text-sm text-gray-500">{percentage}%</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => setShowCorrect(!showCorrect)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {showCorrect
                ? "Скрыть правильные ответы"
                : "Показать правильные ответы"}
            </button>
            <button
              onClick={startQuiz}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Пройти заново
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {questions.map((q, idx) => {
            const userAnswer = selectedAnswers[idx];
            const isCorrect = userAnswer === q.correct_answer;
            const answered = userAnswer !== -1;

            return (
              <div
                key={q.id}
                className={`p-4 border rounded-lg ${
                  showCorrect
                    ? isCorrect
                      ? "border-green-400 bg-green-50"
                      : answered
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                        showCorrect && isCorrect
                          ? "bg-green-500 text-white"
                          : showCorrect && answered && !isCorrect
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{q.question}</p>
                    <div className="mt-2 space-y-1">
                      {q.options.map((option, optIdx) => {
                        const isSelected = userAnswer === optIdx;
                        const isCorrectAnswer =
                          showCorrect && q.correct_answer === optIdx;
                        let bgColor = "bg-gray-50";
                        if (showCorrect) {
                          if (isCorrectAnswer)
                            bgColor = "bg-green-100 border-green-300";
                          else if (isSelected && !isCorrectAnswer)
                            bgColor = "bg-red-100 border-red-300";
                        } else if (isSelected) {
                          bgColor = "bg-blue-100 border-blue-300";
                        }
                        return (
                          <div
                            key={optIdx}
                            className={`px-3 py-1.5 rounded-lg border text-sm ${bgColor} ${
                              isSelected || (showCorrect && isCorrectAnswer)
                                ? "border-2"
                                : "border-gray-200"
                            }`}
                          >
                            <span className="font-medium text-gray-500 mr-2">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {option}
                            {showCorrect && isCorrectAnswer && (
                              <span className="ml-2 text-green-600">✅</span>
                            )}
                            {showCorrect && isSelected && !isCorrectAnswer && (
                              <span className="ml-2 text-red-600">❌</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              setShowResults(false);
              setCurrentQuestionIndex(0);
            }}
            className="px-4 py-2 text-sm text-blue-600 hover:underline"
          >
            ← Вернуться к вопросам
          </button>
        </div>
      </div>
    );
  }

  // Отображение текущего вопроса
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = selectedAnswers[currentQuestionIndex];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToQuestion(idx)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition ${
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
        <span className="text-sm text-gray-400">
          {selectedAnswers.filter((a) => a !== -1).length} / {questions.length}{" "}
          отвечено
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-800 mb-4">
          {currentQuestion.question}
        </h4>
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = currentAnswer === idx;
            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition ${
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

      <div className="flex justify-between mt-6">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>
        <button
          onClick={goToNextQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {currentQuestionIndex === questions.length - 1
            ? "📊 Узнать результат"
            : "Далее →"}
        </button>
      </div>
    </div>
  );
}
