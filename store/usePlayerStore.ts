import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ProgressEntry {
  seriesId: string;
  episodeId: string;
  position: number; // seconds watched
  duration: number; // total seconds
  updatedAt: number;
}

interface Preferences {
  playbackRate: number;
  volume: number;
  muted: boolean;
}

interface PlayerState {
  progress: Record<string, ProgressEntry>; // key: `${seriesId}:${episodeId}`
  preferences: Preferences;
  setProgress: (entry: ProgressEntry) => void;
  clearProgress: (seriesId: string, episodeId: string) => void;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

const key = (s: string, e: string) => `${s}:${e}`;

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      progress: {},
      preferences: {
        playbackRate: 1,
        volume: 1,
        muted: false,
      },
      setProgress: (entry) =>
        set((state) => ({
          progress: { ...state.progress, [key(entry.seriesId, entry.episodeId)]: entry },
        })),
      clearProgress: (seriesId, episodeId) =>
        set((state) => {
          const next = { ...state.progress };
          delete next[key(seriesId, episodeId)];
          return { progress: next };
        }),
      setPreference: (k, v) =>
        set((state) => ({ preferences: { ...state.preferences, [k]: v } })),
    }),
    {
      name: "aircast.player",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (s) => ({ progress: s.progress, preferences: s.preferences }),
    },
  ),
);

export function getProgress(seriesId: string, episodeId: string): ProgressEntry | undefined {
  return usePlayerStore.getState().progress[key(seriesId, episodeId)];
}
