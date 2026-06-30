export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Character {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  about: string;
  image: string | null;
  image_url: string | null;
}
export interface Review {
  id: number;
  book: number;
  user: number;
  username: string;
  user_avatar: string | null;
  rating: number;
  text: string;
  created_at: string;
  updated_at: string;
  can_edit: boolean;
  can_delete: boolean;
}
export interface Book {
  id: number;
  name: string;
  author: string;
  country: string;
  genre: string;
  year: number;
  description: string;
  rating: number;
  cover: string | null;
  cover_url: string | null;
  review: string;
  is_active: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  hours_to_read: number;
  average_rating?: number;
  reviews_count?: number;
  brief_summary: string;
  characters: Character[];
}

export interface BookFilters {
  search?: string;
  genre?: string;
  author?: string;
  country?: string;
  genre__in?: string;
  author__in?: string;
  country__in?: string;
  year__gte?: number;
  year__lte?: number;
  hours_to_read__gte?: number;
  hours_to_read__lte?: number;
  rating__gte?: number;
  rating__lte?: number;
  ordering?: string;
}
export interface BookCreate {
  name: string;
  author: string;
  country?: string;
  genre: string;
  year: number;
  description: string;
  rating?: number;
  cover?: File | null;
  review?: string;
}
export interface Interaction {
  id: number;
  user: number;
  user_email: string;
  username: string;
  avatar_url: string | null;
  interaction_type: "like" | "dislike" | "favorite" | "read" | "view";
  text: string | null;
  parent: number | null;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  dislikes_count?: number;
  user_reaction?: "comment_like" | "comment_dislike" | null;
}
export interface InteractionCounts {
  likes: number;
  dislikes: number;
  favorites: number;
  reads: number;
  views: number;
  comments: number;
}

export interface ToggleInteractionResponse {
  action: "added" | "removed";
  counts: InteractionCounts;
  interaction: Interaction | null;
}
export interface BookUpdate extends Partial<BookCreate> {}
