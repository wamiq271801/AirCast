export interface Episode {
  id: string;
  number: number;
  title: string;
  description?: string;
  duration?: number; // seconds
  thumbnail?: string;
  resolution?: string;
}

export interface Season {
  number: number;
  title?: string;
  episodes: Episode[];
}

export interface Series {
  id: string;
  type?: "series";
  title: string;
  tagline?: string;
  description: string;
  year?: number;
  genres?: string[];
  poster?: string;
  backdrop?: string;
  logo?: string;
  creators?: string[];
  stars?: string[];
  /** Either flat episodes or seasons. Prefer seasons; episodes is the fast path. */
  episodes?: Episode[];
  seasons?: Season[];
}

export interface Movie {
  id: string;
  type: "movie";
  title: string;
  year?: number;
  genres?: string[];
  description: string;
  poster?: string;
  backdrop?: string;
  thumbnail?: string;
  duration?: string;
  durationSeconds?: number;
  resolution?: string;
  tagline?: string;
  stars?: string[];
  directors?: string[];
}

export type MediaItem = Movie | (Series & { type: "series" });

export interface MediaIndex {
  schemaVersion?: number;
  generated?: string;
  movies: Movie[];
  series: Series[];
}
