"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PostGrid } from "@/components/profile/PostGrid";
import { EditProfileModal, type EditProfileInitial } from "@/components/profile/EditProfileModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/mock-data";

type Tab = "Posts" | "Milestones" | "Repos";

const TABS: Tab[] = ["Posts", "Milestones", "Repos"];

const HIGHLIGHT_EMOJI = ["🔥", "🏆", "🚀", "🌙", "🎓"];

function itemsForTab(tab: Tab, grid: Profile["grid"]) {
  if (tab === "Milestones") return grid.slice(0, 3);
  if (tab === "Repos")
    return grid.filter((g) => /C\+\+|Go|Next\.js|Java/i.test(g.meta));
  return grid;
}

export function OwnProfileView({
  profile,
  initial,
}: {
  profile: Profile;
  initial: EditProfileInitial;
}) {
  const [tab, setTab] = useState<Tab>("Posts");
  const [editing, setEditing] = useState(false);

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <ProfileHeader profile={profile} isOwn onEdit={() => setEditing(true)} />

      {!profile.bio && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-ig-border bg-ig-subtle px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm text-ig-text dark:text-white/90">
            Your profile has no bio yet — tell people what you build.
          </p>
          <Button size="sm" onClick={() => setEditing(true)} className="shrink-0">
            Add a bio
          </Button>
        </div>
      )}

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

      <PostGrid items={itemsForTab(tab, profile.grid)} />

      {editing && (
        <EditProfileModal initial={initial} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
