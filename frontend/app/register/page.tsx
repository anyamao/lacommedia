"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";
export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");
  const { register, loading } = useAuth();
  const { showToast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

    return (
      <div className="max-w-md mx-auto mt-16">
        <h1 className="text-3xl font-bold text-center mb-8">Регистрация</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Пароль (минимум 12 символов)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={12}
          />
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={form.password2}
            onChange={(e) => setForm({ ...form, password2: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Загрузка..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="text-center mt-4">
          Уже есть аккаунт?{" "}
          <a href="/auth/login" className="text-blue-600">
            Войти
          </a>
        </p>
      </div>
    );
  };
}
