"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useQuery } from "@tanstack/react-query";
import { getMovieById } from "@/services/media";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function MoviePage() {
  const params = useParams<{ movieId: string }>();
  const movieId = params?.movieId || "";
  
  const { isAuthenticated } = useAuth();
  const { data: movie, isPending } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => getMovieById(movieId).then((m) => m ?? null),
    enabled: isAuthenticated && !!movieId,
  });

  if (!isAuthenticated || isPending) {
    return <div className="min-h-dvh animate-pulse bg-surface" />;
  }

  if (!movie) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold">Movie not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This movie doesn't exist in your library.
          </p>
          <Button asChild variant="secondary" className="mt-6 rounded-full">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <section className="relative -mt-14 h-[60svh] min-h-[420px] w-full overflow-hidden sm:-mt-16">
        {movie.backdrop ? (
          <img
            src={movie.backdrop}
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
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {movie.year && <span>{movie.year}</span>}
                {movie.resolution && (
                  <span className="rounded-full border border-border px-2 py-0.5">
                    {movie.resolution}
                  </span>
                )}
                {movie.genres?.map((g) => (
                  <span key={g} className="rounded-full border border-border px-2 py-0.5">
                    {g}
                  </span>
                ))}
                {movie.duration && <span>· {movie.duration}</span>}
              </div>
              <p className="text-balance text-sm text-muted-foreground sm:text-base">
                {movie.description}
              </p>
              <div className="pt-2">
                <Button asChild size="lg" className="rounded-full px-6">
                  <Link href={`/watch/movie/${movie.id}`}>
                    <Play className="mr-1 h-4 w-4 fill-current" />
                    Play Movie
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
