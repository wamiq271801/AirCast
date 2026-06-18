"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/ui/back-button";
import { lazy, Suspense } from "react";
import { getMovieById } from "@/services/media";
import { getMoviePlayback } from "@/services/playback";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const VideoPlayer = lazy(() =>
  import("@/components/player/VideoPlayer").then((m) => ({ default: m.VideoPlayer })),
);

export default function WatchMoviePage() {
  const params = useParams<{ movieId: string }>();
  const movieId = params?.movieId || "";
  
  const { isAuthenticated } = useAuth();
  const { data: movie, isPending } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => getMovieById(movieId),
    enabled: isAuthenticated && !!movieId,
  });

  const { data: playback, isPending: playbackPending, error: playbackError } = useQuery({
    queryKey: ["playback", "movie", movieId],
    queryFn: () => getMoviePlayback(movieId),
    enabled: isAuthenticated && !!movieId,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!isAuthenticated || isPending) {
    return <div className="min-h-dvh animate-pulse bg-background" />;
  }

  if (!movie) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This movie doesn't exist.</p>
          <Button asChild variant="secondary" className="mt-6 rounded-full">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-16">
      <div className="sticky top-0 z-30">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-3 sm:h-14 sm:px-6 lg:px-8">
          <BackButton
            fallbackHref={`/movie/${movie.id}`}
            className="min-w-0 max-w-full"
          >
            <span className="truncate">{movie.title}</span>
          </BackButton>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-2 sm:px-6 lg:px-8">
        {playbackError ? (
          <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-surface text-center text-sm text-muted-foreground">
            <div className="px-4">
              <p className="font-medium text-foreground">Playback unavailable</p>
              <p className="mt-1">Couldn't fetch a stream URL. Try again.</p>
            </div>
          </div>
        ) : playbackPending || !playback ? (
          <div className="aspect-video w-full animate-pulse rounded-2xl bg-surface" />
        ) : (
          <Suspense fallback={<div className="aspect-video w-full animate-pulse rounded-2xl bg-surface" />}>
            <VideoPlayer
              key={movie.id}
              src={playback.url}
              poster={movie.thumbnail ?? movie.backdrop}
              seriesId="movie"
              episodeId={movie.id}
              autoPlay
            />
          </Suspense>
        )}

        <div className="mt-6 space-y-2 px-2 sm:px-0">
          {movie.year && (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {movie.year}
              {movie.duration ? ` · ${movie.duration}` : ""}
            </p>
          )}
          <h1 className="text-balance font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {movie.title}
          </h1>
          {movie.description && (
            <p className="max-w-3xl text-balance text-sm text-muted-foreground sm:text-base">
              {movie.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
