"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import logoAsset from "@/assets/aircast-logo.png";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const { status, isAuthenticated } = useAuth();

  const isLogin = pathname === "/login";
  const isWatch = pathname.startsWith("/watch/");

  // Route protection: redirect to /login when unauthenticated.
  useEffect(() => {
    if (status === "unauthenticated" && !isLogin) {
      router.replace("/login");
    }
  }, [status, isLogin, router]);

  // Login page renders standalone.
  if (isLogin) {
    return (
      <div className="min-h-dvh bg-background text-foreground">{children}</div>
    );
  }

  // While bootstrapping or redirecting, render a quiet shell.
  if (status === "loading" || (status === "unauthenticated" && !isAuthenticated)) {
    return <div className="min-h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {!isWatch && <Header />}
      <main
        id="main"
        className={isWatch ? "min-h-dvh" : "min-h-dvh pt-14 sm:pt-16"}
      >
        {children}
      </main>
      {!isWatch && <Footer />}
    </div>
  );
}

function Header() {
  const { logout } = useAuth();
  const router = useRouter();

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="pointer-events-auto group inline-flex items-center gap-2 rounded-full bg-background/60 py-1.5 pl-1.5 pr-3.5 ring-1 ring-border/40 backdrop-blur-xl transition-colors hover:bg-background/80"
          aria-label="AirCast — Home"
        >
          <span
            aria-hidden
            className="block h-6 w-6 bg-foreground transition-transform group-hover:scale-105"
            style={{
              WebkitMaskImage: `url(${logoAsset})`,
              maskImage: `url(${logoAsset})`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
          <span className="font-display text-sm font-semibold tracking-tight sm:text-base">
            AirCast
          </span>
        </Link>
        <nav className="pointer-events-auto flex items-center gap-1 rounded-full bg-background/60 p-1 text-sm ring-1 ring-border/40 backdrop-blur-xl">
          <NavLink href="/">Home</NavLink>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-muted-foreground transition-colors hover:text-foreground ${isActive ? "bg-foreground/10 text-foreground" : ""}`}
    >
      {children}
    </Link>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-8 text-center text-xs text-muted-foreground sm:px-6 lg:px-8">
      <p>AirCast — personal streaming.</p>
    </footer>
  );
}
