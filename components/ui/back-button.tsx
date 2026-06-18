"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { type ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  fallbackHref: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Browser-native back navigation. Pops history when available so the user
 * returns to the exact previous page (with scroll position restored by the
 * router). Falls back to an explicit route when there's no prior entry —
 * e.g. when the page was opened from a fresh tab or external link.
 */
export function BackButton({
  fallbackHref,
  children,
  className,
}: BackButtonProps) {
  const router = useRouter();

  const canGoBack =
    typeof window !== "undefined" &&
    window.history.length > 1 &&
    // Next.js doesn't tag history state the exact same way, but length > 2 usually means we can go back
    window.history.length > 2;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!canGoBack) return; // let <Link> handle fallback navigation
      e.preventDefault();
      router.back();
    },
    [canGoBack, router],
  );

  const baseClass = cn(
    "inline-flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1.5 text-sm font-medium text-foreground/90 ring-1 ring-border/40 backdrop-blur-xl transition-colors hover:bg-background/80 hover:text-foreground",
    className,
  );

  return (
    // The Link is still an <a> with a real href so middle-click / cmd-click
    // and "open in new tab" work as expected when no history exists.
    <Link
      href={fallbackHref}
      onClick={handleClick}
      aria-label="Go back"
      className={baseClass}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {children ?? <span>Back</span>}
    </Link>
  );
}
