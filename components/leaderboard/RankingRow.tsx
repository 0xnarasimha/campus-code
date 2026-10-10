"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { students, type RankingRow as RankingEntry } from "@/lib/mock-data";

export function RankingRow({ entry, rank }: { entry: RankingEntry; rank: number }) {
  const [following, setFollowing] = useState(false);
  const stacks = students.find((s) => s.handle === entry.handle)?.stacks ?? [];
  const positive = entry.delta > 0;
  const flat = entry.delta === 0;

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5">
      <span className="w-7 shrink-0 font-mono text-sm font-bold text-ig-secondary">
        {rank}
      </span>
      <Avatar name={entry.name} className="h-9 w-9 text-xs" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ig-text dark:text-white">
          {entry.name}{" "}
          <span className="font-normal text-ig-secondary">@{entry.handle}</span>
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {stacks.map((stack) => (
            <Badge key={stack}>{stack}</Badge>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-bold text-ig-text dark:text-white">
          {entry.points.toLocaleString()}
        </span>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
            flat
              ? "bg-ig-subtle text-ig-secondary dark:bg-white/10"
              : positive
                ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
          )}
        >
          {flat ? "– 0" : positive ? `▲ +${entry.delta}` : `▼ ${entry.delta}`}
        </span>
      </div>
      <Button
        variant={following ? "secondary" : "primary"}
        size="sm"
        className="shrink-0"
        aria-pressed={following}
        onClick={() => setFollowing((v) => !v)}
      >
        {following ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
