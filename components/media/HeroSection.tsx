import Link from "next/link";
import { motion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { MediaItem } from "@/types/media";
import { getEpisodes } from "@/services/media";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  item: MediaItem;
}

export function HeroSection({ item }: HeroSectionProps) {
  const isMovie = item.type === "movie";
  const episodes = isMovie ? [] : getEpisodes(item);
  const firstEpisode = episodes[0];

  const progress = usePlayerStore((s) => s.progress);
  const resumeEntry = isMovie
    ? progress[`movie:${item.id}`]
    : episodes
        .map((e) => progress[`${item.id}:${e.id}`])
        .filter(Boolean)
        .sort((a, b) => b!.updatedAt - a!.updatedAt)[0];

  // Subtle parallax on scroll
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const onScroll = () => setOffset(Math.min(window.scrollY * 0.15, 80));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logo = isMovie ? undefined : item.logo;
  const creators = isMovie ? undefined : item.creators;

  return (
    <section
      aria-label={`Featured: ${item.title}`}
      className="relative isolate -mt-14 h-[80svh] min-h-[520px] w-full overflow-hidden sm:-mt-16 sm:h-[88svh]"
    >
      {item.backdrop && (
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
          style={{ transform: `translateY(${offset}px)` }}
        >
          <img
            src={item.backdrop}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        </motion.div>
      )}
      {!item.backdrop && (
        <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated to-background" />
      )}

      <div className="absolute inset-0 hero-fade" />
      <div className="absolute inset-0 hero-side-fade" />

      <div className="relative z-10 flex h-full items-end pb-16 sm:pb-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="max-w-2xl space-y-4"
          >
            {logo ? (
              <img
                src={logo}
                alt={item.title}
                className="max-h-28 w-auto"
              />
            ) : (
              <h1 className="text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                {item.title}
              </h1>
            )}
            {item.tagline && (
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {item.tagline}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {item.year && <span className="font-medium text-foreground/80">{item.year}</span>}
              {isMovie ? (
                item.duration && (
                  <>
                    {item.year && <span aria-hidden>·</span>}
                    <span>{item.duration}</span>
                  </>
                )
              ) : (
                episodes.length > 0 && (
                  <>
                    {item.year && <span aria-hidden>·</span>}
                    <span>{episodes.length} episodes</span>
                  </>
                )
              )}
            </div>

            {item.genres && item.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-border/60 bg-background/30 px-2.5 py-0.5 text-[11px] font-medium text-foreground/80 backdrop-blur"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
              {item.description}
            </p>

            {(item.stars?.length || creators?.length) && (
              <dl className="space-y-1 text-xs sm:text-sm">
                {creators?.length ? (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-semibold text-foreground/90">Creators</dt>
                    <dd className="text-muted-foreground">{creators.join(" · ")}</dd>
                  </div>
                ) : null}
                {item.stars?.length ? (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="font-semibold text-foreground/90">Stars</dt>
                    <dd className="text-muted-foreground">{item.stars.join(" · ")}</dd>
                  </div>
                ) : null}
              </dl>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {isMovie ? (
                <>
                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link href={`/watch/movie/${item.id}`}>
                      {resumeEntry ? (
                        <>
                          <RotateCcw className="mr-1 h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-4 w-4 fill-current" />
                          Watch now
                        </>
                      )}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="rounded-full bg-white/10 px-6 backdrop-blur hover:bg-white/15"
                  >
                    <Link href={`/movie/${item.id}`}>
                      More info
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  {resumeEntry && firstEpisode ? (
                    <Button asChild size="lg" className="rounded-full px-6">
                      <Link
                        href={`/watch/${item.id}/${resumeEntry.episodeId}`}
                      >
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Resume
                      </Link>
                    </Button>
                  ) : (
                    firstEpisode && (
                      <Button asChild size="lg" className="rounded-full px-6">
                        <Link
                          href={`/watch/${item.id}/${firstEpisode.id}`}
                        >
                          <Play className="mr-1 h-4 w-4 fill-current" />
                          Watch now
                        </Link>
                      </Button>
                    )
                  )}
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="rounded-full bg-white/10 px-6 backdrop-blur hover:bg-white/15"
                  >
                    <Link href={`/series/${item.id}`}>
                      More info
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
