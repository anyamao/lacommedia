import { apiClient } from "@/lib/api/client";
import { Content, ContentFilters } from "@/lib/api/types";

class ContentService {
  async getContent(filters?: ContentFilters): Promise<Content[]> {
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
    const url = queryString ? `/content/?${queryString}` : "/content/";

    console.log("📡 Fetching:", url); // Для отладки

    try {
      const response = await apiClient.get<Content[]>(url);
      return response || [];
    } catch (error) {
      console.error("Error fetching content:", error);
      return [];
    }
  }

  async getContentItem(id: number): Promise<Content> {
    return apiClient.get<Content>(`/content/${id}/`);
  }
}

export const contentService = new ContentService();
