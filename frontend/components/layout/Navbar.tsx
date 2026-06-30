"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";

export function Navbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"));
  }, []);

  const navItems = [
    { href: "/books", label: "📚 Книги" },
    { href: "/movies", label: "🎬 Фильмы" },
    { href: "/paintings", label: "🖼️ Картины" },
    { href: "/music", label: "🎵 Музыка" },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Lacomedia
          </Link>

          <div className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  pathname?.startsWith(item.href)
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/profile"
                className="text-gray-600 hover:text-blue-600"
              >
                👤 Профиль
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
