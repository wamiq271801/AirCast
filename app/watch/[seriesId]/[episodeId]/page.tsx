"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { lazy, Suspense } from "react";
import { getAdjacentEpisodes, getEpisodes, getSeriesById } from "@/services/media";
import { getEpisodePlayback } from "@/services/playback";
import { useAuth } from "@/lib/auth";
import { EpisodeCard } from "@/components/media/EpisodeCard";
import { Button } from "@/components/ui/button";

const VideoPlayer = lazy(() =>
  import("@/components/player/VideoPlayer").then((m) => ({ default: m.VideoPlayer })),
);

export default function WatchSeriesPage() {
  const params = useParams<{ seriesId: string; episodeId: string }>();
  const seriesId = params?.seriesId || "";
  const episodeId = params?.episodeId || "";
  const router = useRouter();
  
  const { isAuthenticated } = useAuth();
  const { data: series, isPending } = useQuery({
    queryKey: ["series", seriesId],
    queryFn: () => getSeriesById(seriesId),
    enabled: isAuthenticated && !!seriesId,
  });

  const { data: playback, isPending: playbackPending, error: playbackError } = useQuery({
    queryKey: ["playback", "series", seriesId, episodeId],
    queryFn: () => getEpisodePlayback(seriesId, episodeId),
    enabled: isAuthenticated && !!seriesId && !!episodeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!isAuthenticated || isPending) {
    return <div className="min-h-dvh animate-pulse bg-background" />;
  }

  if (!series) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This series or episode doesn't exist.
          </p>
          <Button asChild variant="secondary" className="mt-6 rounded-full">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { current, prev, next } = getAdjacentEpisodes(series, episodeId);
  if (!current) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Episode not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This episode doesn't exist in the series.
          </p>
          <Button asChild variant="secondary" className="mt-6 rounded-full">
            <Link href={`/series/${seriesId}`}>
              Back to series
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const episodes = getEpisodes(series);

  return (
    <div className="min-h-dvh bg-background pb-16">
      <div className="sticky top-0 z-30">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-4 px-3 sm:h-14 sm:px-6 lg:px-8">
          <BackButton
            fallbackHref={`/series/${series.id}`}
            className="min-w-0 max-w-full"
          >
            <span className="truncate">{series.title}</span>
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
              key={current.id}
              src={playback.url}
              poster={current.thumbnail ?? series.backdrop}
              seriesId={series.id}
              episodeId={current.id}
              autoPlay
              onEnded={() => {
                if (next) {
                  router.push(`/watch/${series.id}/${next.id}`);
                }
              }}
            />
          </Suspense>
        )}

        <div className="mt-6 space-y-2 px-2 sm:px-0">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Episode {current.number}
          </p>
          <h1 className="text-balance font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {current.title}
          </h1>
          {current.description && (
            <p className="max-w-3xl text-balance text-sm text-muted-foreground sm:text-base">
              {current.description}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 px-2 sm:flex sm:flex-wrap sm:px-0">
          {prev ? (
            <Link
              href={`/watch/${series.id}/${prev.id}`}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-secondary px-5 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80 sm:w-auto sm:min-w-[140px]"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Previous</span>
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-secondary px-5 text-sm font-medium text-secondary-foreground/60 opacity-50 sm:w-auto sm:min-w-[140px]"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Previous</span>
            </span>
          )}
          {next ? (
            <Link
              href={`/watch/${series.id}/${next.id}`}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 sm:w-auto sm:min-w-[140px]"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground opacity-50 sm:w-auto sm:min-w-[140px]"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </span>
          )}
        </div>

        <section className="mt-12 space-y-3 px-2 sm:px-0">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Episodes
          </h2>
          <div className="space-y-1">
            {episodes.map((ep) => (
              <EpisodeCard
                key={ep.id}
                episode={ep}
                seriesId={series.id}
                active={ep.id === current.id}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
