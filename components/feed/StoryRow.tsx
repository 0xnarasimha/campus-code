"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { students } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const peers = students.slice(0, 6);
const LIVE_COUNT = 2;

function firstName(name: string) {
  return name.split(" ")[0];
}

export function StoryRow() {
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  function markSeen(id: string) {
    setSeenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <div
      className="scrollbar-hide -mx-1 flex gap-4 overflow-x-auto px-1 py-2"
      aria-label="Stories"
    >
      {/* Your story — always first */}
      <button
        type="button"
        aria-label="Your story"
        style={{ animationDelay: "0ms" }}
        className="animate-fade-up flex w-16 shrink-0 flex-col items-center gap-1"
      >
        <span className="story-ring relative rounded-full bg-ig-border p-[2.5px] dark:bg-white/15">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-xs font-bold text-text ring-2 ring-surface">
            You
          </span>
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-ig-blue text-white"
          >
            <Plus className="h-3 w-3" strokeWidth={3} />
          </span>
        </span>
        <span className="w-full truncate text-center text-[11px] font-medium text-ig-text dark:text-white">
          Your story
        </span>
      </button>

      {peers.map((s, i) => {
        const seen = seenIds.has(s.id);
        const live = i < LIVE_COUNT && !seen;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => markSeen(s.id)}
            aria-label={`${firstName(s.name)}'s story${seen ? " (seen)" : ""}${live ? " (live)" : ""}`}
            style={{ animationDelay: `${(i + 1) * 60}ms` }}
            className="animate-fade-up flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <span
              className={cn(
                "story-ring relative rounded-full p-[2.5px]",
                seen
                  ? "bg-ig-border dark:bg-white/15"
                  : "story-gradient"
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-xs font-bold text-text ring-2 ring-surface">
                {s.avatarInitials}
              </span>
              {live && (
                <span className="absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border-2 border-surface bg-red-500 px-1.5 py-px text-[9px] font-bold tracking-wide text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  LIVE
                </span>
              )}
            </span>
            <span
              className={cn(
                "w-full truncate text-center text-[11px] font-medium",
                seen
                  ? "text-ig-secondary"
                  : "text-ig-text dark:text-white"
              )}
            >
              {firstName(s.name)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
