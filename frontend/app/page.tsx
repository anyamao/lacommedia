"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">📚 Библиотека</h1>
        <p className="text-xl text-gray-600 mb-8">
          Добро пожаловать в каталог книг
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/books"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            📖 Книги
          </Link>

          {isAuthenticated ? (
            <Link
              href="/profile"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              👤 Профиль
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-block bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                🔐 Войти
              </Link>
              <Link
                href="/auth/register"
                className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                ✨ Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
