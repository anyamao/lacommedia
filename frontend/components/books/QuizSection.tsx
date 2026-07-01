"use client";

import { useState } from "react";
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
}

export function QuizSection({
  contentId,
  questions,
  title = "🧠 Тест",
}: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const { showToast } = useToast();

  const hasQuestions = questions && questions.length > 0;

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

  if (!hasQuestions) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">Для этого урока пока нет теста</p>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="text-center py-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">
          В тесте {questions.length} вопросов. Проверьте свои знания!
        </p>
        <button
          onClick={startQuiz}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
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
        <div className="text-center py-4 border-b mb-4">
          <h3 className="text-xl font-bold mb-1">
            {isPassed ? "🎉 Отлично!" : "📚 Попробуйте еще раз!"}
          </h3>
          <p className="text-base">
            Правильных ответов:{" "}
            <span className="font-bold text-blue-600">{score}</span> из {total}
          </p>
          <p className="text-sm text-gray-500">{percentage}%</p>
          <div className="mt-3 flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => setShowCorrect(!showCorrect)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {showCorrect ? "Скрыть ответы" : "Показать ответы"}
            </button>
            <button
              onClick={startQuiz}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Пройти заново
            </button>
            <button
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
              }}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              ← К вопросам
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
          {questions.map((q, idx) => {
            const userAnswer = selectedAnswers[idx];
            const isCorrect = userAnswer === q.correct_answer;
            const answered = userAnswer !== -1;

            return (
              <div
                key={q.id}
                className={`p-3 border rounded-lg text-sm ${
                  showCorrect
                    ? isCorrect
                      ? "border-green-400 bg-green-50"
                      : answered
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium flex-shrink-0 ${
                      showCorrect && isCorrect
                        ? "bg-green-500 text-white"
                        : showCorrect && answered && !isCorrect
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">
                      {q.question}
                    </p>
                    <div className="mt-1.5 space-y-1">
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
                            className={`px-2 py-1 rounded border text-xs ${bgColor} ${
                              isSelected || (showCorrect && isCorrectAnswer)
                                ? "border-2"
                                : "border-gray-200"
                            }`}
                          >
                            <span className="font-medium text-gray-500 mr-1.5">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {option}
                            {showCorrect && isCorrectAnswer && (
                              <span className="ml-1.5 text-green-600">✅</span>
                            )}
                            {showCorrect && isSelected && !isCorrectAnswer && (
                              <span className="ml-1.5 text-red-600">❌</span>
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
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {currentQuestionIndex === questions.length - 1
            ? "📊 Результат"
            : "Далее →"}
        </button>
      </div>
    </div>
  );
}
