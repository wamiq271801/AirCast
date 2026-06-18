"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllContent } from "@/services/media";
import { useAuth } from "@/lib/auth";
import { HeroSection } from "@/components/media/HeroSection";
import { ContinueWatching } from "@/components/media/ContinueWatching";
import { Row, Grid } from "@/components/media/Row";
import { SeriesCard } from "@/components/media/SeriesCard";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data: items, isPending } = useQuery({
    queryKey: ["library"],
    queryFn: () => getAllContent(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || isPending) {
    return <HomeSkeleton />;
  }

  if (!items || items.length === 0) {
    return <EmptyState />;
  }

  const featured = items[0];
  const recentlyAdded = [...items].slice(0, 12);

  return (
    <div className="space-y-12 pb-16 sm:space-y-16">
      <HeroSection item={featured} />

      <ContinueWatching items={items} />

      <Row title="Recently added">
        {recentlyAdded.map((s, i) => (
          <div key={`${s.type}:${s.id}`} className="w-[160px] shrink-0 snap-start sm:w-[180px]">
            <SeriesCard item={s} index={i} />
          </div>
        ))}
      </Row>

      <section className="space-y-6">
        <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            All titles
          </h2>
        </header>
        <Grid>
          {items.map((s, i) => (
            <SeriesCard key={`${s.type}:${s.id}`} item={s} index={i} />
          ))}
        </Grid>
      </section>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-12 pb-16">
      <div className="-mt-14 h-[80svh] min-h-[520px] w-full animate-pulse bg-surface sm:-mt-16 sm:h-[88svh]" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
        AirCast
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Your library is empty
      </h1>
      <p className="mt-3 max-w-md text-balance text-sm text-muted-foreground sm:text-base">
        Nothing here yet. Add titles to your backend library and they'll appear instantly.
      </p>
      <Button onClick={() => window.location.reload()} variant="secondary" className="mt-6 rounded-full">
        Refresh
      </Button>
    </div>
  );
}
