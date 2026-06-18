import Link from "next/link";
import { Play } from "lucide-react";
import { useMemo } from "react";
import type { MediaItem } from "@/types/media";
import { getEpisodes } from "@/services/media";
import { usePlayerStore } from "@/store/usePlayerStore";
import { progressPercent, formatDuration } from "@/lib/format";
import { Row } from "./Row";

interface ContinueWatchingProps {
  items: MediaItem[];
}

export function ContinueWatching({ items }: ContinueWatchingProps) {
  const progress = usePlayerStore((s) => s.progress);

  const entries = useMemo(() => {
    const list = Object.entries(progress)
      .filter(([, e]) => e.position > 5 && (e.duration === 0 || e.position < e.duration - 30))
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt);

    return list
      .map(([key, entry]) => {
        if (entry.seriesId === "movie") {
          const movie = items.find((m) => m.type === "movie" && m.id === entry.episodeId);
          if (!movie || movie.type !== "movie") return null;
          return { kind: "movie" as const, movie, entry, key };
        }
        const series = items.find((s) => s.type === "series" && s.id === entry.seriesId);
        if (!series || series.type !== "series") return null;
        const ep = getEpisodes(series).find((e) => e.id === entry.episodeId);
        if (!ep) return null;
        return { kind: "series" as const, series, episode: ep, entry, key };
      })
      .filter(Boolean)
      .slice(0, 12) as Array<
      | {
          kind: "movie";
          movie: Extract<MediaItem, { type: "movie" }>;
          entry: (typeof list)[number][1];
          key: string;
        }
      | {
          kind: "series";
          series: Extract<MediaItem, { type: "series" }>;
          episode: ReturnType<typeof getEpisodes>[number];
          entry: (typeof list)[number][1];
          key: string;
        }
    >;
  }, [progress, items]);

  if (entries.length === 0) return null;

  return (
    <Row title="Continue watching">
      {entries.map((item) => {
        const pct = progressPercent(item.entry.position, item.entry.duration);
        const remaining = formatDuration(item.entry.duration - item.entry.position);
        if (item.kind === "movie") {
          const m = item.movie;
          return (
            <Link
              key={item.key}
              href={`/watch/movie/${m.id}`}
              className="group relative w-[280px] shrink-0 snap-start sm:w-[320px]"
            >
              <Card
                image={m.thumbnail ?? m.backdrop}
                title={m.title}
                subtitle={`${remaining} left`}
                pct={pct}
              />
            </Link>
          );
        }
        const s = item.series;
        const ep = item.episode;
        return (
          <Link
            key={item.key}
            href={`/watch/${s.id}/${ep.id}`}
            className="group relative w-[280px] shrink-0 snap-start sm:w-[320px]"
          >
            <Card
              image={ep.thumbnail ?? s.backdrop}
              title={s.title}
              subtitle={`E${ep.number} · ${ep.title} · ${remaining} left`}
              pct={pct}
            />
          </Link>
        );
      })}
    </Row>
  );
}

function Card({
  image,
  title,
  subtitle,
  pct,
}: {
  image?: string;
  title: string;
  subtitle: string;
  pct: number;
}) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition-all duration-300 group-hover:ring-white/30">
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-surface-elevated to-background" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-black">
          <Play className="h-5 w-5 fill-current" />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
        <h3 className="line-clamp-1 text-sm font-medium text-white">{title}</h3>
        <p className="line-clamp-1 text-xs text-white/70">{subtitle}</p>
        <div className="h-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
