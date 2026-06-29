export const API_ENDPOINTS = {
  BOOKS: {
    LIST: "/books/",
    DETAIL: (id: number) => `/books/${id}/`,
    CREATE: "/books/",
    UPDATE: (id: number) => `/books/${id}/`,
    PARTIAL_UPDATE: (id: number) => `/books/${id}/`,
    DELETE: (id: number) => `/books/${id}/`,
  },
  AUTH: {
    LOGIN: "/token/",
    REFRESH: "/token/refresh/",
    VERIFY: "/token/verify/",
  },
} as const;
