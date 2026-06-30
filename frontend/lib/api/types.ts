export type ContentType = "book" | "movie" | "painting" | "music";

export interface Character {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  about: string;
  image: string | null;
  image_url: string | null;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
}

export interface Content {
  id: number;
  content_type: ContentType;
  content_type_display: string;
  title: string;
  description: string;
  cover: string | null;
  cover_url: string | null;
  short_description: string;
  rating: number;
  year: number | null;
  genre: string;
  country: string;
  views_count: number;
  hours_to_read: number;
  brief_summary: string;
  review: string;
  ideas: string;
  interesting_facts: { title: string; fact: string }[];
  extra_data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  reviews_count: number;
  characters: Character[];
  quiz_questions: QuizQuestion[];
}

export interface ContentFilters {
  search?: string;
  content_type?: ContentType;
  genre?: string;
  country?: string;
  genre__in?: string;
  country__in?: string;
  year__gte?: number;
  year__lte?: number;
  rating__gte?: number;
  rating__lte?: number;
  ordering?: string;
}

// ✅ Добавляем для книг
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

// ✅ Добавляем BookCreate и BookUpdate
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
  hours_to_read?: number;
  brief_summary?: string;
  ideas?: string;
}

export interface BookUpdate extends Partial<BookCreate> {}

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
  brief_summary: string;
  characters: Character[];
  average_rating?: number;
  reviews_count?: number;
  ideas?: string;
  interesting_facts?: { title: string; fact: string }[];
  quiz_questions?: QuizQuestion[];
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
export interface FavoriteItem {
  id: number;
  content_type: ContentType;
  content_type_display: string;
  title: string;
  cover: string | null;
  cover_url: string | null;
  rating: number;
  genre: string;
  year: number | null;
  author?: string;
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
