"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PostGrid } from "@/components/profile/PostGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { useSimulatedLoad } from "@/lib/use-simulated-load";
import { profile } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Tab = "Posts" | "Milestones" | "Repos";

const TABS: Tab[] = ["Posts", "Milestones", "Repos"];

const HIGHLIGHT_EMOJI = ["🔥", "🏆", "🚀", "🌙", "🎓"];

function itemsForTab(tab: Tab) {
  if (tab === "Milestones") return profile.grid.slice(0, 3);
  if (tab === "Repos")
    return profile.grid.filter((g) =>
      /C\+\+|Go|Next\.js|Java/i.test(g.meta)
    );
  return profile.grid;
}

export default function ProfilePage() {
  const loading = useSimulatedLoad();
  const [tab, setTab] = useState<Tab>("Posts");

  if (loading) {
    return (
      <div className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex flex-1 justify-around">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <ProfileHeader profile={profile} isOwn />

      <div className="flex gap-4 overflow-x-auto py-1" aria-label="Highlights">
        {profile.highlights.map((h, i) => (
          <div key={h} className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-ig-border bg-ig-subtle text-xl dark:border-white/10 dark:bg-white/10">
              <span aria-hidden>{HIGHLIGHT_EMOJI[i % HIGHLIGHT_EMOJI.length]}</span>
            </div>
            <span className="max-w-16 truncate text-[11px] text-ig-secondary">
              {h}
            </span>
          </div>
        ))}
      </div>

      <div className="flex border-t border-ig-border dark:border-white/10" role="tablist" aria-label="Profile content">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 border-t-2 py-2 text-xs font-semibold uppercase tracking-wide",
              tab === t
                ? "border-ig-text text-ig-text dark:border-white dark:text-white"
                : "border-transparent text-ig-secondary"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <PostGrid items={itemsForTab(tab)} />
    </div>
  );
}
