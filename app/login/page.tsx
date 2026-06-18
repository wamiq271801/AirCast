"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoAsset from "@/assets/aircast-logo.png";

export default function LoginPage() {
  const { status, isAuthenticated, login } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect password");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm rounded-3xl border border-border/60 bg-surface/60 p-8 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden
            className="block h-10 w-10 bg-foreground"
            style={{
              WebkitMaskImage: `url(${logoAsset.src})`,
              maskImage: `url(${logoAsset.src})`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
          <h1 className="font-display text-2xl font-semibold tracking-tight">AirCast</h1>
          <p className="text-sm text-muted-foreground">
            Enter your password to access your library.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <Input
            type="password"
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="h-11 rounded-full border-border/60 bg-background/60 px-5"
          />
          {error && (
            <p className="text-center text-xs text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={!password || submitting || status === "loading"}
            className="h-11 w-full rounded-full text-sm font-medium"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
