"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
} from "@/hooks/useProfile";
import { apiClient } from "@/lib/api/client";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, isLoading, mutate } = useProfile();
  const { updateProfile, loading: updateLoading } = useUpdateProfile();
  const { changePassword, loading: passwordLoading } = useChangePassword();

  // Форма редактирования
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    dark_theme: false,
  });

  // Форма смены пароля
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        username: profile.username || "",
        dark_theme: profile.dark_theme || false,
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    await apiClient.logout();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateProfile(formData);
    if (result.success) {
      setEditMode(false);
      mutate(); // Обновляем данные
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordData.new_password !== passwordData.new_password2) {
      setPasswordError("Пароли не совпадают");
      return;
    }

    if (passwordData.new_password.length < 12) {
      setPasswordError("Пароль должен быть минимум 12 символов");
      return;
    }

    const result = await changePassword(
      passwordData.old_password,
      passwordData.new_password,
    );
    if (result.success) {
      setPasswordSuccess(true);
      setPasswordData({
        old_password: "",
        new_password: "",
        new_password2: "",
      });
      setTimeout(() => setShowPasswordForm(false), 2000);
    } else if (result.error) {
      setPasswordError(result.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка профиля...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Не авторизован</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Шапка профиля */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 sm:px-10">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="h-20 w-20 rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold border-4 border-white">
                    {profile.full_name?.[0] || profile.username?.[0] || "U"}
                  </div>
                )}
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-blue-100">@{profile.username}</p>
                <p className="text-blue-100 text-sm">{profile.email}</p>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                    Уровень {profile.level}
                  </span>
                  {profile.dark_theme && (
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                      🌙 Тема
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Контент */}
          <div className="px-6 py-6 sm:px-10">
            {/* Редактирование профиля */}
            {!editMode ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Информация
                  </h2>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    ✏️ Редактировать
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Имя</p>
                    <p className="font-medium">
                      {profile.first_name || "Не указано"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Фамилия</p>
                    <p className="font-medium">
                      {profile.last_name || "Не указано"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Уровень</p>
                    <p className="font-medium">{profile.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Темная тема</p>
                    <p className="font-medium">
                      {profile.dark_theme ? "🌙 Включена" : "☀️ Выключена"}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    🔑 Сменить пароль
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    🚪 Выйти
                  </button>
                </div>

                {/* Форма смены пароля */}
                {showPasswordForm && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-medium text-gray-800 mb-3">
                      Смена пароля
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <input
                        type="password"
                        placeholder="Старый пароль"
                        value={passwordData.old_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            old_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="password"
                        placeholder="Новый пароль (мин. 12 символов)"
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        minLength={12}
                      />
                      <input
                        type="password"
                        placeholder="Подтвердите новый пароль"
                        value={passwordData.new_password2}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            new_password2: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      {passwordError && (
                        <div className="text-red-600 text-sm">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="text-green-600 text-sm">
                          ✅ Пароль успешно изменен!
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {passwordLoading ? "Смена..." : "Сменить пароль"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              // Форма редактирования
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Редактирование профиля
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Имя
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dark_theme"
                    checked={formData.dark_theme}
                    onChange={(e) =>
                      setFormData({ ...formData, dark_theme: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="dark_theme" className="text-sm text-gray-700">
                    Включить темную тему
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {updateLoading ? "Сохранение..." : "💾 Сохранить"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
