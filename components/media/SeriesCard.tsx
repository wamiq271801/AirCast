import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { MediaItem } from "@/types/media";

interface MediaCardProps {
  item: MediaItem;
  index?: number;
}

export function SeriesCard({ item, index = 0 }: MediaCardProps) {
  const isMovie = item.type === "movie";
  const href = isMovie
    ? `/movie/${item.id}`
    : `/series/${item.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={href}
        className="group block focus:outline-none"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition-all duration-300 group-hover:ring-white/30 group-focus-visible:ring-2 group-focus-visible:ring-ring">
          {item.poster ? (
            <img
              src={item.poster}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-elevated to-background">
              <span className="px-4 text-center font-display text-lg font-semibold text-muted-foreground">
                {item.title}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 text-xs text-white/90">
              <Play className="h-3.5 w-3.5 fill-current" />
              <span className="font-medium">Watch</span>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          <h3 className="line-clamp-1 text-sm font-medium text-foreground">
            {item.title}
          </h3>
          {item.year && (
            <p className="text-xs text-muted-foreground">
              {item.year}
              {item.genres?.length ? ` · ${item.genres[0]}` : ""}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Backwards-compatible default export name alias
export const MediaCard = SeriesCard;
