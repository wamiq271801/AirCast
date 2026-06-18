import { apiRequest } from "@/lib/api-client";
import type { Episode, MediaIndex, MediaItem, Movie, Series } from "@/types/media";

const LIBRARY_PATH = "/api/library";

let cache: Promise<MediaIndex> | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeEpisode(raw: any): Episode {
  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    description: raw.description,
    duration:
      typeof raw.durationSeconds === "number"
        ? raw.durationSeconds
        : typeof raw.duration === "number"
          ? raw.duration
          : undefined,
    thumbnail: raw.thumbnail ?? undefined,
    resolution: raw.resolution,
  };
}

function normalizeSeries(raw: any): Series {
  return {
    id: raw.id,
    type: "series",
    title: raw.title,
    tagline: raw.tagline,
    description: raw.description,
    year: raw.year,
    genres: Array.isArray(raw.genres)
      ? raw.genres
      : Array.isArray(raw.genre)
        ? raw.genre
        : undefined,
    poster: raw.poster,
    backdrop: raw.backdrop,
    logo: raw.logo,
    creators: Array.isArray(raw.creators) ? raw.creators : undefined,
    stars: Array.isArray(raw.stars) ? raw.stars : undefined,
    episodes: raw.episodes?.map(normalizeEpisode),
    seasons: raw.seasons?.map((s: any) => ({
      number: s.number,
      title: s.title,
      episodes: (s.episodes ?? []).map(normalizeEpisode),
    })),
  };
}

function normalizeMovie(raw: any): Movie {
  return {
    id: raw.id,
    type: "movie",
    title: raw.title,
    year: raw.year,
    genres: Array.isArray(raw.genres)
      ? raw.genres
      : Array.isArray(raw.genre)
        ? raw.genre
        : undefined,
    description: raw.description ?? "",
    poster: raw.poster,
    backdrop: raw.backdrop,
    thumbnail: raw.thumbnail,
    duration: typeof raw.duration === "string" ? raw.duration : undefined,
    durationSeconds:
      typeof raw.durationSeconds === "number" ? raw.durationSeconds : undefined,
    resolution: raw.resolution,
    tagline: raw.tagline,
    stars: Array.isArray(raw.stars) ? raw.stars : undefined,
    directors: Array.isArray(raw.directors) ? raw.directors : undefined,
  };
}

function normalizeMediaIndex(raw: any): MediaIndex {
  return {
    schemaVersion: raw.schemaVersion,
    generated: raw.generated,
    movies: Array.isArray(raw.movies) ? raw.movies.map(normalizeMovie) : [],
    series: Array.isArray(raw.series) ? raw.series.map(normalizeSeries) : [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function fetchMediaIndex(): Promise<MediaIndex> {
  if (!cache) {
    cache = (async () => {
      if (typeof document === "undefined") {
        return { movies: [], series: [] };
      }
      const raw = await apiRequest<unknown>(LIBRARY_PATH, { method: "GET" });
      return normalizeMediaIndex(raw);
    })().catch((err) => {
      cache = null;
      throw err;
    });
  }
  return cache;
}

export function clearMediaIndexCache() {
  cache = null;
}

export async function getAllSeries(): Promise<Series[]> {
  const { series } = await fetchMediaIndex();
  return series;
}

export async function getSeriesById(id: string): Promise<Series | undefined> {
  const series = await getAllSeries();
  return series.find((s) => s.id === id);
}

export async function getAllMovies(): Promise<Movie[]> {
  const { movies } = await fetchMediaIndex();
  return movies;
}

export async function getMovieById(id: string): Promise<Movie | undefined> {
  const movies = await getAllMovies();
  return movies.find((m) => m.id === id);
}

export async function getAllContent(): Promise<MediaItem[]> {
  const { movies, series } = await fetchMediaIndex();
  const combined: MediaItem[] = [
    ...movies,
    ...series.map((s) => ({ ...s, type: "series" as const })),
  ];
  return combined.sort((a, b) => a.title.localeCompare(b.title));
}

export function getEpisodes(series: Series): Episode[] {
  if (series.episodes?.length) return series.episodes;
  if (series.seasons?.length) return series.seasons.flatMap((s) => s.episodes);
  return [];
}

export function getEpisode(series: Series, episodeId: string): Episode | undefined {
  return getEpisodes(series).find((e) => e.id === episodeId);
}

export function getAdjacentEpisodes(series: Series, episodeId: string) {
  const list = getEpisodes(series);
  const idx = list.findIndex((e) => e.id === episodeId);
  return {
    prev: idx > 0 ? list[idx - 1] : undefined,
    next: idx >= 0 && idx < list.length - 1 ? list[idx + 1] : undefined,
    current: idx >= 0 ? list[idx] : undefined,
  };
}
