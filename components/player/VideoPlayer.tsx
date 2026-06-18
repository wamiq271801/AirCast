import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

// Plyr ships UMD types with `export =`; namespace import is the only
// form that works without esModuleInterop.
import * as PlyrNS from "plyr";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plyr: any = (PlyrNS as any).default ?? PlyrNS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlyrInstance = any;
import { AnimatePresence, motion } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  seriesId: string;
  episodeId: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

type SeekSide = "left" | "right";
interface SeekFeedback {
  side: SeekSide;
  amount: number;
  id: number;
}

const DOUBLE_TAP_MS = 300;
const FEEDBACK_TIMEOUT_MS = 700;
const SEEK_STEP = 10;

export function VideoPlayer({
  src,
  poster,
  seriesId,
  episodeId,
  autoPlay = false,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const plyrRef = useRef<PlyrInstance | null>(null);

  const setProgress = usePlayerStore((s) => s.setProgress);
  const preferences = usePlayerStore((s) => s.preferences);
  const setPreference = usePlayerStore((s) => s.setPreference);

  // Gesture state
  const lastTapRef = useRef<{ time: number; side: SeekSide } | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const cumulativeRef = useRef<{ side: SeekSide; amount: number } | null>(null);
  const feedbackIdRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pauseDebounceRef = useRef<number | null>(null);

  const [feedback, setFeedback] = useState<SeekFeedback | null>(null);
  const [plyrContainer, setPlyrContainer] = useState<HTMLElement | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const scheduleFeedbackClear = useCallback(() => {
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      cumulativeRef.current = null;
      feedbackTimerRef.current = null;
    }, FEEDBACK_TIMEOUT_MS);
  }, []);

  const performSeek = useCallback(
    (side: SeekSide) => {
      const video = videoRef.current;
      if (!video || !isFinite(video.duration)) return;
      const delta = side === "left" ? -SEEK_STEP : SEEK_STEP;
      const next = Math.max(0, Math.min(video.duration, video.currentTime + delta));
      try {
        video.currentTime = next;
      } catch {
        /* noop */
      }
      const cum = cumulativeRef.current;
      const amount = cum && cum.side === side ? cum.amount + SEEK_STEP : SEEK_STEP;
      cumulativeRef.current = { side, amount };
      feedbackIdRef.current += 1;
      setFeedback({ side, amount, id: feedbackIdRef.current });
      scheduleFeedbackClear();
    },
    [scheduleFeedbackClear],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.src = src;
    video.load();

    const plyr: PlyrInstance = new Plyr(video, {
      controls: [
        "play",
        "rewind",
        "fast-forward",
        "progress",
        "current-time",
        "duration",
        "settings",
        "pip",
        "airplay",
        "fullscreen",
      ],
      settings: ["captions", "speed"],
      speed: { selected: preferences.playbackRate, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
      seekTime: 10,
      tooltips: { controls: false, seek: false },
      clickToPlay: false,
      ratio: "16:9",
      storage: { enabled: false },
    });
    plyrRef.current = plyr;

    plyr.volume = preferences.volume;
    plyr.muted = preferences.muted;
    plyr.speed = preferences.playbackRate;

    plyr.on("volumechange", () => {
      setPreference("volume", plyr.volume);
      setPreference("muted", plyr.muted);
    });
    plyr.on("ratechange", () => {
      setPreference("playbackRate", plyr.speed);
    });
    plyr.on("ended", () => {
      onEnded?.();
    });

    const existing = usePlayerStore.getState().progress[`${seriesId}:${episodeId}`];
    let resumed = false;
    const tryResume = () => {
      if (resumed) return;
      const duration = video.duration;
      if (!duration || isNaN(duration) || !isFinite(duration)) return;
      if (existing && existing.position > 5 && existing.position < duration - 30) {
        try {
          video.currentTime = existing.position;
        } catch {
          /* noop */
        }
      }
      resumed = true;
      if (autoPlay) void video.play().catch(() => {});
    };

    if (video.readyState >= 1) tryResume();
    video.addEventListener("loadedmetadata", tryResume);
    video.addEventListener("durationchange", tryResume);

    let lastSave = 0;
    const onTime = () => {
      if (!resumed) return;
      const now = Date.now();
      if (now - lastSave < 3000) return;
      lastSave = now;
      if (!video.duration || isNaN(video.duration)) return;
      setProgress({
        seriesId,
        episodeId,
        position: video.currentTime,
        duration: video.duration,
        updatedAt: now,
      });
    };
    video.addEventListener("timeupdate", onTime);
    const onPause = () => {
      pauseDebounceRef.current = window.setTimeout(() => {
        setIsPaused(true);
        onTime();
      }, 200);
    };
    const onPlay = () => {
      if (pauseDebounceRef.current !== null) {
        window.clearTimeout(pauseDebounceRef.current);
        pauseDebounceRef.current = null;
      }
      setIsPaused(false);
    };
    setIsPaused(video.paused);
    video.addEventListener("pause", onPause);
    video.addEventListener("play", onPlay);

    const container = video.closest(".plyr") as HTMLElement | null;
    setPlyrContainer(container);

    return () => {
      if (pauseDebounceRef.current !== null) {
        window.clearTimeout(pauseDebounceRef.current);
        pauseDebounceRef.current = null;
      }
      video.removeEventListener("loadedmetadata", tryResume);
      video.removeEventListener("durationchange", tryResume);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("play", onPlay);
      setPlyrContainer(null);
      plyrRef.current?.destroy();
      plyrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, seriesId, episodeId]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // YouTube-style gesture overlay:
  // - Center taps pass through to Plyr natively (toggle controls / play-pause)
  // - Double-tap left/right third seeks -10s / +10s
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0];
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!t || !start) return;

    if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > 18) return;
    if (Date.now() - start.time > 400) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = t.clientX - rect.left;
    const zone: SeekSide | "center" =
      x < rect.width * 0.35 ? "left" : x > rect.width * 0.65 ? "right" : "center";

    if (zone === "center") return; // Let Plyr handle center taps natively

    const now = Date.now();
    const last = lastTapRef.current;
    const isDouble = last && last.side === zone && now - last.time < DOUBLE_TAP_MS;

    if (isDouble) {
      lastTapRef.current = null;
      e.preventDefault();
      performSeek(zone);
      return;
    }

    lastTapRef.current = { time: now, side: zone };
    // Single tap in side zones: let the synthetic click reach Plyr so controls toggle
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-border">
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        controls
        preload="metadata"
        className="h-full w-full"
      />

      {plyrContainer &&
        createPortal(
          <>
            {isTouch && (
              <div
                className="absolute inset-x-0 top-0 bottom-[72px] z-[2] touch-manipulation select-none"
                aria-hidden="true"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={() => (touchStartRef.current = null)}
              />
            )}

            <div className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-between px-6 sm:px-10">
              <div className="flex w-24 justify-center sm:w-32">
                <AnimatePresence mode="popLayout">
                  {feedback?.side === "left" && (
                    <motion.div
                      key={feedback.id}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex flex-col items-center gap-1 rounded-full bg-black/55 px-4 py-3 backdrop-blur-md"
                    >
                      <span className="text-2xl leading-none">⏪</span>
                      <span className="text-xs font-medium text-white/90">{feedback.amount}s</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex w-24 justify-center sm:w-32">
                <AnimatePresence mode="popLayout">
                  {feedback?.side === "right" && (
                    <motion.div
                      key={feedback.id}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="flex flex-col items-center gap-1 rounded-full bg-black/55 px-4 py-3 backdrop-blur-md"
                    >
                      <span className="text-2xl leading-none">⏩</span>
                      <span className="text-xs font-medium text-white/90">{feedback.amount}s</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isPaused && (
              <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
                <button
                  type="button"
                  aria-label="Play"
                  className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full text-white transition-transform active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    void videoRef.current?.play().catch(() => {});
                  }}
                  style={{ filter: "drop-shadow(0 2px 8px rgb(0 0 0 / 0.6))" }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-14 w-14">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            )}
          </>,
          plyrContainer,
        )}
    </div>
  );
}
