"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FollowInfo } from "@/lib/actions/social";
import {
  FOLLOW_LABEL,
  useFollowToggle,
} from "@/components/social/use-follow";
import { students, type RankingRow as RankingEntry } from "@/lib/mock-data";

const badgeStyles: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-950",
  2: "bg-slate-300 text-slate-800",
  3: "bg-amber-600 text-white",
};

function PodiumCard({
  entry,
  rank,
  follow,
}: {
  entry: RankingEntry;
  rank: number;
  follow?: FollowInfo;
}) {
  const { state, busy, toggle } = useFollowToggle(
    entry.handle,
    follow?.state ?? "none"
  );
  const student = students.find((s) => s.handle === entry.handle);
  const stats = student
    ? `${student.solved} solved · CF ${student.cfRating} · ${student.commits} commits`
    : entry.detail;

  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-col items-center gap-2 text-center">
        <Badge className={cn("animate-float-soft font-mono", badgeStyles[rank] ?? "")}>
          #{String(rank).padStart(2, "0")}
        </Badge>
        <Avatar name={entry.name} className="h-12 w-12 text-base" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ig-text dark:text-white">
            <Link href={`/profile/${entry.handle}`} className="hover:underline">
              {entry.name}
            </Link>
          </p>
          <p className="truncate text-xs text-ig-secondary">
            <Link href={`/profile/${entry.handle}`} className="hover:underline">
              @{entry.handle}
            </Link>
            {follow?.isPrivate && (
              <Lock
                className="ml-1 inline h-3 w-3"
                aria-label="Private profile"
              />
            )}
          </p>
        </div>
        <p className="text-sm font-bold text-ig-text dark:text-white">
          {entry.points.toLocaleString()} pts
        </p>
        <p className="text-[11px] text-ig-secondary">{stats}</p>
        <Button
          variant={state !== "none" ? "secondary" : "primary"}
          size="sm"
          className="w-full"
          aria-pressed={state !== "none"}
          disabled={busy || !follow}
          onClick={() => void toggle()}
        >
          {FOLLOW_LABEL[state]}
        </Button>
      </CardContent>
    </Card>
  );
}

export function Podium({
  top3,
  follows,
}: {
  top3: RankingEntry[];
  follows?: Record<string, FollowInfo>;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {top3.map((entry) => (
        <PodiumCard
          key={entry.handle}
          entry={entry}
          rank={entry.rank}
          follow={follows?.[entry.handle]}
        />
      ))}
    </div>
  );
}
