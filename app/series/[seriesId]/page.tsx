"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useQuery } from "@tanstack/react-query";
import { getEpisodes, getSeriesById } from "@/services/media";
import { useAuth } from "@/lib/auth";
import { EpisodeCard } from "@/components/media/EpisodeCard";
import { Button } from "@/components/ui/button";

export default function SeriesPage() {
  const params = useParams<{ seriesId: string }>();
  const seriesId = params?.seriesId || "";
  
  const { isAuthenticated } = useAuth();
  const { data: series, isPending } = useQuery({
    queryKey: ["series", seriesId],
    queryFn: () => getSeriesById(seriesId).then((s) => s ?? null),
    enabled: isAuthenticated && !!seriesId,
  });

  if (!isAuthenticated || isPending) {
    return <div className="min-h-dvh animate-pulse bg-surface" />;
  }

  if (!series) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Series not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This series doesn't exist in your library.
          </p>
          <Button asChild variant="secondary" className="mt-6 rounded-full">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const episodes = getEpisodes(series);
  const firstEpisode = episodes[0];

  return (
    <div className="pb-16">
      <section className="relative -mt-14 h-[60svh] min-h-[420px] w-full overflow-hidden sm:-mt-16">
        {series.backdrop ? (
          <img
            src={series.backdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated to-background" />
        )}
        <div className="absolute inset-0 hero-fade" />
        <div className="relative z-10 flex h-full items-end pb-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <BackButton fallbackHref="/" className="mb-6">
              Back
            </BackButton>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl space-y-3"
            >
              <h1 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                {series.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {series.year && <span>{series.year}</span>}
                {series.genres?.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border px-2 py-0.5"
                  >
                    {g}
                  </span>
                ))}
                <span>· {episodes.length} episodes</span>
              </div>
              <p className="text-balance text-sm text-muted-foreground sm:text-base">
                {series.description}
              </p>
              {firstEpisode && (
                <div className="pt-2">
                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link
                      href={`/watch/${series.id}/${firstEpisode.id}`}
                    >
                      <Play className="mr-1 h-4 w-4 fill-current" />
                      Play E1
                    </Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-3 px-4 pt-8 sm:px-6 lg:px-8">
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Episodes
        </h2>
        <div className="space-y-1">
          {episodes.length === 0 && (
            <p className="text-sm text-muted-foreground">No episodes yet.</p>
          )}
          {episodes.map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} seriesId={series.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
