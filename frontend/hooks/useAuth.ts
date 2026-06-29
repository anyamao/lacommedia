"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { user } = await apiClient.login(email, password);
        router.push("/profile");
        return { success: true, user };
      } catch (err: any) {
        const message = err.response?.data?.detail || "Ошибка входа";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const register = useCallback(
    async (data: {
      email: string;
      username: string;
      password: string;
      password2: string;
      first_name?: string;
      last_name?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.post("/auth/register/", data);
        // Автоматический вход после регистрации
        const { user } = await apiClient.login(data.email, data.password);
        router.push("/profile");
        return { success: true, user };
      } catch (err: any) {
        const message = err.response?.data?.detail || "Ошибка регистрации";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    await apiClient.logout();
  }, []);

  return { login, register, logout, loading, error };
}
