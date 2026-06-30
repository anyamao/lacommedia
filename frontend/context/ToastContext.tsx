"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "error" | "success" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => {
        const bgColor =
          toast.type === "error"
            ? "bg-red-600"
            : toast.type === "success"
              ? "bg-green-600"
              : "bg-gray-700";

        const icon =
          toast.type === "error"
            ? "❌"
            : toast.type === "success"
              ? "✅"
              : "ℹ️";

        return (
          <div
            key={toast.id}
            className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-right-5 duration-300`}
          >
            <span className="text-lg">{icon}</span>
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/70 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
