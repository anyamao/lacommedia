import { apiClient } from "@/lib/api/client";
import { FavoriteItem } from "@/lib/api/types";

export class FavoriteService {
  async getFavorites(): Promise<FavoriteItem[]> {
    // Получаем все взаимодействия типа 'favorite'
    // TODO: Добавить эндпоинт на бэкенде для получения всех избранных
    // Пока используем заглушку
    return apiClient.get<FavoriteItem[]>("/favorites/");
  }

  async getFavoritesByType(contentType: string): Promise<FavoriteItem[]> {
    return apiClient.get<FavoriteItem[]>(
      `/favorites/?content_type=${contentType}`,
    );
  }
}

export const favoriteService = new FavoriteService();
