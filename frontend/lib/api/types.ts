export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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
  review: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookFilters {
  genre?: string;
  author?: string;
  year?: number;
  rating_gte?: number;
  rating_lte?: number;
  search?: string;
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

export interface BookUpdate extends Partial<BookCreate> {}
