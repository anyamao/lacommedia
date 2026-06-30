import Link from "next/link";

export default function Home() {
  const sections = [
    { type: "books", emoji: "📚", label: "Книги" },
    { type: "movies", emoji: "🎬", label: "Фильмы" },
    { type: "paintings", emoji: "🖼️", label: "Картины" },
    { type: "music", emoji: "🎵", label: "Музыка" },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">🎨 Lacomedia</h1>
        <p className="text-xl text-gray-600 mb-8">
          Каталог книг, фильмов, картин и музыки
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          {sections.map((section) => (
            <Link
              key={section.type}
              href={`/${section.type}`}
              className="inline-block bg-white text-gray-800 px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="text-4xl mb-2">{section.emoji}</div>
              {section.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
