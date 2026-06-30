"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading, error } = useAuth();
  const { showToast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Проверка username на стороне клиента
    if (!/^[a-zA-Z0-9]+$/.test(form.username)) {
      showToast(
        "Username может содержать только буквы и цифры (латиница)",
        "error",
      );
      return;
    }

    const result = await register(form);
    if (result.success) {
      showToast("Регистрация успешна! Добро пожаловать!", "success");
    } else if (result.error) {
      showToast(result.error, "error");
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Создать аккаунт
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Уже есть аккаунт?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Войдите
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700"
              >
                Имя
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={form.first_name}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Иван"
              />
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700"
              >
                Фамилия
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={form.last_name}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Иванов"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Пароль (минимум 12 символов)
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={12}
                value={form.password}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="password2"
              className="block text-sm font-medium text-gray-700"
            >
              Подтвердите пароль
            </label>
            <input
              id="password2"
              name="password2"
              type="password"
              required
              value={form.password2}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Регистрация...
              </span>
            ) : (
              "Зарегистрироваться"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
