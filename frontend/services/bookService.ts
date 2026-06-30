import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { Book, BookCreate, BookUpdate, BookFilters } from "@/lib/api/types";

class BookService {
  async getBooks(filters?: BookFilters): Promise<Book[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            params.append(key, value.join(","));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.BOOKS.LIST}?${queryString}`
      : API_ENDPOINTS.BOOKS.LIST;

    try {
      const response = await apiClient.get<Book[]>(url);
      return response || [];
    } catch (error) {
      console.error("Error fetching books:", error);
      return [];
    }
  }
  async getBook(id: number): Promise<Book> {
    return apiClient.get<Book>(API_ENDPOINTS.BOOKS.DETAIL(id));
  }

  async createBook(data: BookCreate): Promise<Book> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === "cover" && value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    // ✅ Исправляем: передаем только URL и данные
    return apiClient.post<Book>(API_ENDPOINTS.BOOKS.CREATE, formData);
  }

  async updateBook(id: number, data: BookUpdate): Promise<Book> {
    return apiClient.put<Book>(API_ENDPOINTS.BOOKS.UPDATE(id), data);
  }

  async patchBook(id: number, data: BookUpdate): Promise<Book> {
    return apiClient.patch<Book>(API_ENDPOINTS.BOOKS.PARTIAL_UPDATE(id), data);
  }

  async deleteBook(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.BOOKS.DELETE(id));
  }

  async searchBooks(query: string): Promise<Book[]> {
    return this.getBooks({ search: query });
  }

  async getBooksByGenre(genre: string): Promise<Book[]> {
    return this.getBooks({ genre });
  }
}

export const bookService = new BookService();
