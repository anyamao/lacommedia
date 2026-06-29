"use client";

import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import { useState, useCallback } from "react";

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  level: number;
  avatar: string | null;
  avatar_url: string | null;
  dark_theme: boolean;
  created_at: string;
  updated_at: string;
}

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  isError: string | null; // ✅ string | null
  mutate: () => void;
}

export function useProfile(): UseProfileReturn {
  const { data, error, mutate, isLoading } = useSWR(
    "/auth/profile/",
    () => apiClient.get<UserProfile>("/auth/profile/"),
    {
      revalidateOnFocus: true,
      dedupingInterval: 60000,
    },
  );

  return {
    profile: data || null,
    isLoading,
    isError: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null, // ✅ Преобразуем Error в string
    mutate,
  };
}

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.patch<UserProfile>(
        "/auth/profile/",
        data,
      );
      return { success: true, data: response };
    } catch (err: any) {
      const message = err.response?.data?.detail || "Ошибка обновления профиля";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateProfile, loading, error };
}

export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.post("/auth/profile/change-password/", {
          old_password: oldPassword,
          new_password: newPassword,
        });
        return { success: true };
      } catch (err: any) {
        const message = err.response?.data?.detail || "Ошибка смены пароля";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { changePassword, loading, error };
}
