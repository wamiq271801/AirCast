import { apiRequest } from "@/lib/api-client";

export interface PlaybackResponse {
  url: string;
  expiresIn: number;
}

export function getMoviePlayback(movieId: string): Promise<PlaybackResponse> {
  return apiRequest<PlaybackResponse>(
    `/api/play/movie/${encodeURIComponent(movieId)}`,
    { method: "GET" },
  );
}

export function getEpisodePlayback(
  seriesId: string,
  episodeId: string,
): Promise<PlaybackResponse> {
  return apiRequest<PlaybackResponse>(
    `/api/play/series/${encodeURIComponent(seriesId)}/${encodeURIComponent(episodeId)}`,
    { method: "GET" },
  );
}
