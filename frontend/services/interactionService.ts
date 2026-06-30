import { apiClient } from "@/lib/api/client";
import {
  Interaction,
  InteractionCounts,
  ToggleInteractionResponse,
} from "@/lib/api/types";

export class InteractionService {
  private static instance: InteractionService;

  static getInstance(): InteractionService {
    if (!InteractionService.instance) {
      InteractionService.instance = new InteractionService();
    }
    return InteractionService.instance;
  }

  async toggle(
    content_type: string,
    object_id: number,
    interaction_type: string,
  ): Promise<ToggleInteractionResponse> {
    return apiClient.post<ToggleInteractionResponse>("/interactions/toggle/", {
      content_type,
      object_id,
      interaction_type,
    });
  }

  async addComment(
    content_type: string,
    object_id: number,
    text: string,
    parent_id?: number,
  ): Promise<Interaction> {
    return apiClient.post<Interaction>("/interactions/add_comment/", {
      content_type,
      object_id,
      text,
      parent_id,
    });
  }

  async getComments(
    content_type: string,
    object_id: number,
  ): Promise<Interaction[]> {
    return apiClient.get<Interaction[]>(
      `/interactions/comments/?content_type=${content_type}&object_id=${object_id}`,
    );
  }

  async getUserInteraction(
    content_type: string,
    object_id: number,
  ): Promise<Record<string, boolean>> {
    return apiClient.get<Record<string, boolean>>(
      `/interactions/user_interaction/?content_type=${content_type}&object_id=${object_id}`,
    );
  }
  async recordView(
    content_type: string,
    object_id: number,
  ): Promise<{ status: string; is_new: boolean; views_count: number }> {
    return apiClient.post("/interactions/view/", {
      content_type,
      object_id,
    });
  }
}

export const interactionService = InteractionService.getInstance();
