"use client";

import { useProfile } from "@/hooks/useProfile";

export function ProfileCard() {
  const { profile, isLoading, isError } = useProfile();

  if (isLoading) return <div>Загрузка...</div>;
  if (isError) return <div>Ошибка загрузки профиля</div>;
  if (!profile) return <div>Не авторизован</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center space-x-4">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {profile.full_name?.[0] || "U"}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          <p className="text-gray-600">@{profile.username}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Уровень</span>
          <span className="font-semibold">{profile.level}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-gray-600">Темная тема</span>
          <span className="font-semibold">
            {profile.dark_theme ? "🌙 Да" : "☀️ Нет"}
          </span>
        </div>
      </div>
    </div>
  );
}
