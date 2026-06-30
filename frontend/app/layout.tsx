import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/context/ToastContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lacomedia",
  description: "Book library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
