import Link from "next/link";
import { Play } from "lucide-react";
import type { Episode } from "@/types/media";
import { formatDuration, progressPercent } from "@/lib/format";
import { usePlayerStore } from "@/store/usePlayerStore";

interface EpisodeCardProps {
  episode: Episode;
  seriesId: string;
  active?: boolean;
}

export function EpisodeCard({ episode, seriesId, active }: EpisodeCardProps) {
  const entry = usePlayerStore((s) => s.progress[`${seriesId}:${episode.id}`]);
  const pct = entry ? progressPercent(entry.position, entry.duration) : 0;

  return (
    <Link
      href={`/watch/${seriesId}/${episode.id}`}
      className={`group flex gap-4 rounded-2xl p-3 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? "bg-accent" : ""
      }`}
    >
      <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-xl bg-surface ring-1 ring-border sm:w-48">
        {episode.thumbnail ? (
          <img
            src={episode.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-elevated to-background text-muted-foreground">
            <Play className="h-6 w-6" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-black">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </div>
        {pct > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
            <div
              className="h-full bg-white"
              style={{ width: `${pct}%` }}
              aria-label={`${Math.round(pct)}% watched`}
            />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            E{episode.number}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDuration(episode.duration)}
          </span>
        </div>
        <h3 className="mt-1 line-clamp-1 text-sm font-medium text-foreground sm:text-base">
          {episode.title}
        </h3>
        {episode.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
            {episode.description}
          </p>
        )}
      </div>
    </Link>
  );
}
