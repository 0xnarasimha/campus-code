"use client";

import { Home, MapPin, Send, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { label: "Home", href: "/", icon: Home },
  { label: "Study Hub", href: "/study-hub", icon: MapPin },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Messages", href: "/messages", icon: Send },
  { label: "Profile", href: "/profile", icon: User },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-400 via-pink-600 to-indigo-600 text-sm font-bold text-white">
        M
      </span>
      <span className="text-base font-semibold text-ig-text dark:text-white">
        DevDb MBU
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-ig-border bg-white lg:flex dark:border-white/10 dark:bg-black">
        <div className="flex h-16 items-center px-5">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-ig-subtle text-ig-text dark:bg-white/10 dark:text-white"
                    : "text-ig-secondary hover:bg-ig-subtle/60 hover:text-ig-text dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between border-t border-ig-border px-5 py-4 dark:border-white/10">
          <span className="text-xs text-ig-secondary">Theme</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ig-border bg-white/90 px-4 backdrop-blur lg:hidden dark:border-white/10 dark:bg-black/90">
        <Logo />
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="pb-20 lg:pb-0 lg:pl-60">
        <div className="mx-auto w-full max-w-2xl px-4 py-4">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ig-border bg-white/95 backdrop-blur lg:hidden dark:border-white/10 dark:bg-black/95"
      >
        <div className="grid grid-cols-5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active
                    ? "text-ig-blue"
                    : "text-ig-secondary dark:text-white/60"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
