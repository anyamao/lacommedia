import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  Book,
  BookCreate,
  BookUpdate,
  BookFilters,
  ApiResponse,
} from "@/lib/api/types";

class BookService {
  /**
   * Получить список книг с фильтрацией
   */
  async getBooks(filters?: BookFilters): Promise<Book[]> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.BOOKS.LIST}?${queryString}`
      : API_ENDPOINTS.BOOKS.LIST;

    // Если у вас пагинация
    // const response = await apiClient.get<ApiResponse<Book>>(url);
    // return response.results;

    // Без пагинации
    return apiClient.get<Book[]>(url);
  }

  /**
   * Получить книгу по ID
   */
  async getBook(id: number): Promise<Book> {
    return apiClient.get<Book>(API_ENDPOINTS.BOOKS.DETAIL(id));
  }

  /**
   * Создать книгу
   */
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

    return apiClient.post<Book>(API_ENDPOINTS.BOOKS.CREATE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  /**
   * Обновить книгу
   */
  async updateBook(id: number, data: BookUpdate): Promise<Book> {
    return apiClient.put<Book>(API_ENDPOINTS.BOOKS.UPDATE(id), data);
  }

  /**
   * Частично обновить книгу
   */
  async patchBook(id: number, data: BookUpdate): Promise<Book> {
    return apiClient.patch<Book>(API_ENDPOINTS.BOOKS.PARTIAL_UPDATE(id), data);
  }

  /**
   * Удалить книгу
   */
  async deleteBook(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.BOOKS.DELETE(id));
  }

  /**
   * Поиск книг по тексту
   */
  async searchBooks(query: string): Promise<Book[]> {
    return this.getBooks({ search: query });
  }

  /**
   * Получить книги по жанру
   */
  async getBooksByGenre(genre: string): Promise<Book[]> {
    return this.getBooks({ genre });
  }
}

export const bookService = new BookService();
