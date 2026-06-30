"use client";
import { useToast } from "@/context/ToastContext";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { useState } from "react";

interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  level: number;
  total_books_read: number;
  followers_count: number;
  following_count: number;
  friends_count: number;
  relationship: {
    is_following: boolean;
    is_follower: boolean;
    is_friend: boolean;
    can_friend: boolean;
    is_self: boolean;
  };
  created_at: string;
}

interface Book {
  id: number;
  name: string;
  author: string;
  genre: string;
  year: number;
  cover: string | null;
  rating: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [activeTab, setActiveTab] = useState<
    "books" | "followers" | "following" | "friends"
  >("books");
  const { showToast } = useToast();

  // ✅ Получаем текущего пользователя
  const { data: currentUser } = useSWR("/auth/profile/", () =>
    apiClient.get("/auth/profile/").catch(() => null),
  );

  // Загружаем профиль
  const {
    data: profile,
    mutate: mutateProfile,
    error,
  } = useSWR<UserProfile>(
    username ? `/auth/profile/${username}/` : null,
    () => apiClient.get(`/auth/profile/${username}/`),
    {
      revalidateOnFocus: true,
      errorRetryCount: 2,
    },
  );

  // Загружаем прочитанные книги
  const { data: books } = useSWR<Book[]>(
    activeTab === "books" && username
      ? `/auth/profile/${username}/books/`
      : null,
    () => apiClient.get(`/auth/profile/${username}/books/`),
  );

  // Загружаем подписчиков
  const { data: followers } = useSWR<UserProfile[]>(
    activeTab === "followers" && username
      ? `/auth/profile/${username}/followers/`
      : null,
    () => apiClient.get(`/auth/profile/${username}/followers/`),
  );

  // Загружаем подписки
  const { data: following } = useSWR<UserProfile[]>(
    activeTab === "following" && username
      ? `/auth/profile/${username}/following/`
      : null,
    () => apiClient.get(`/auth/profile/${username}/following/`),
  );

  // Загружаем друзей
  const { data: friends } = useSWR<UserProfile[]>(
    activeTab === "friends" && username
      ? `/auth/profile/${username}/friends/`
      : null,
    () => apiClient.get(`/auth/profile/${username}/friends/`),
  );

  // ✅ Подписаться / Отписаться
  const handleFollow = async () => {
    try {
      await apiClient.post("/auth/follow/toggle/", { username });
      await mutateProfile(); // ✅ Обновляем данные
      showToast(`Вы подписались на @${username}`, "success");
    } catch (error: any) {
      showToast(error.response?.data?.error || "Ошибка при подписке", "error");
    }
  };

  // ✅ Добавить в друзья
  const handleAddFriend = async () => {
    try {
      await apiClient.post("/auth/friend/add/", { username });
      await mutateProfile(); // ✅ Обновляем данные
      showToast(`Вы добавили @${username} в друзья! 🎉`, "success");
    } catch (error: any) {
      showToast(error.response?.data?.error || "Ошибка", "error");
    }
  };

  // ✅ Удалить из друзей
  const handleUnfriend = async () => {
    try {
      await apiClient.post("/auth/friend/remove/", { username });
      await mutateProfile(); // ✅ Обновляем данные
      showToast(`Вы удалили @${username} из друзей`, "info");
    } catch (error: any) {
      showToast(
        error.response?.data?.error || "Ошибка при удалении из друзей",
        "error",
      );
    }
  };

  // ✅ Проверяем, свой ли это профиль
  const isOwnProfile = currentUser?.username === username;

  // ✅ Если ошибка 404 — пользователь не найден
  if (error?.response?.status === 404) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">👤</p>
          <h1 className="text-2xl font-bold text-gray-800">
            Пользователь не найден
          </h1>
          <p className="text-gray-500 mt-2">
            Пользователь @{username} не существует
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Загрузка...</div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // ✅ Рендерим кнопку действия в зависимости от статуса
  const renderActionButton = () => {
    if (isOwnProfile) {
      return (
        <Link
          href="/profile"
          className="bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-50 transition"
        >
          ✏️ Редактировать
        </Link>
      );
    }

    const rel = profile.relationship;

    // ✅ Если друзья — показываем кнопку "Удалить из друзей"
    if (rel.is_friend) {
      return (
        <div className="flex gap-2">
          <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm">
            🤝 Друзья
          </span>
          <button
            onClick={handleUnfriend}
            className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600 transition"
          >
            ✕ Удалить
          </button>
        </div>
      );
    }

    // ✅ Если человек подписан на вас — "Добавить в друзья"
    if (rel.can_friend || rel.is_follower) {
      return (
        <button
          onClick={handleAddFriend}
          className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-green-600 transition"
        >
          🤝 Добавить в друзья
        </button>
      );
    }

    // ✅ Если вы подписаны — "Отписаться"
    if (rel.is_following) {
      return (
        <button
          onClick={handleFollow}
          className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-white/30 transition"
        >
          Отписаться
        </button>
      );
    }

    // ✅ Иначе — "Подписаться"
    return (
      <button
        onClick={handleFollow}
        className="bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-50 transition"
      >
        Подписаться
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Карточка профиля */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-white text-4xl font-bold border-4 border-white">
                    {profile.full_name?.[0] || profile.username?.[0] || "U"}
                  </div>
                )}
              </div>
              <div className="text-white flex-1">
                <h1 className="text-3xl font-bold">
                  {profile.full_name || profile.username}
                </h1>
                <p className="text-blue-100">@{profile.username}</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    📚 {profile.total_books_read} книг
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    ⭐ Уровень {profile.level}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    📅 {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-4 text-white text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {profile.followers_count}
                    </div>
                    <div>подписчиков</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {profile.following_count}
                    </div>
                    <div>подписок</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {profile.friends_count}
                    </div>
                    <div>друзей</div>
                  </div>
                </div>

                {/* ✅ Кнопка с новой логикой */}
                {renderActionButton()}
              </div>
            </div>
          </div>

          {/* Табы */}
          <div className="flex border-b overflow-x-auto">
            {[
              { key: "books", label: "📚 Прочитанные" },
              {
                key: "followers",
                label: `👥 Подписчики (${profile.followers_count})`,
              },
              {
                key: "following",
                label: `📌 Подписки (${profile.following_count})`,
              },
              { key: "friends", label: `🤝 Друзья (${profile.friends_count})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Контент */}
          <div className="p-6">
            {activeTab === "books" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {books?.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center py-8">
                    Пока нет прочитанных книг
                  </p>
                ) : (
                  books?.map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.id}`}
                      className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-2xl overflow-hidden">
                          {book.cover ? (
                            <img
                              src={book.cover}
                              alt={book.name}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            "📖"
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">
                            {book.name}
                          </p>
                          <p className="text-xs text-gray-500">{book.author}</p>
                          <p className="text-xs text-gray-400">
                            {book.genre} · {book.year}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {activeTab === "followers" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {followers?.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center py-8">
                    Нет подписчиков
                  </p>
                ) : (
                  followers?.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                        {user.full_name?.[0] || user.username?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {activeTab === "following" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {following?.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center py-8">
                    Нет подписок
                  </p>
                ) : (
                  following?.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                        {user.full_name?.[0] || user.username?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {activeTab === "friends" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends?.length === 0 ? (
                  <p className="text-gray-500 col-span-full text-center py-8">
                    Пока нет друзей
                  </p>
                ) : (
                  friends?.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition border border-green-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white font-bold">
                        {user.full_name?.[0] || user.username?.[0] || "U"}
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          @{user.username}
                        </p>
                        <span className="text-xs text-green-600">
                          🤝 Друзья
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
