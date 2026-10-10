"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { students, type RankingRow as RankingEntry } from "@/lib/mock-data";

const badgeStyles: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-950",
  2: "bg-slate-300 text-slate-800",
  3: "bg-amber-600 text-white",
};

function PodiumCard({ entry, rank }: { entry: RankingEntry; rank: number }) {
  const [following, setFollowing] = useState(false);
  const student = students.find((s) => s.handle === entry.handle);
  const stats = student
    ? `${student.solved} solved · CF ${student.cfRating} · ${student.commits} commits`
    : entry.detail;

  return (
    <Card className="min-w-0">
      <CardContent className="flex flex-col items-center gap-2 text-center">
        <Badge className={cn("font-mono", badgeStyles[rank] ?? "")}>
          #{String(rank).padStart(2, "0")}
        </Badge>
        <Avatar name={entry.name} className="h-12 w-12 text-base" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ig-text dark:text-white">
            {entry.name}
          </p>
          <p className="truncate text-xs text-ig-secondary">@{entry.handle}</p>
        </div>
        <p className="text-sm font-bold text-ig-text dark:text-white">
          {entry.points.toLocaleString()} pts
        </p>
        <p className="text-[11px] text-ig-secondary">{stats}</p>
        <Button
          variant={following ? "secondary" : "primary"}
          size="sm"
          className="w-full"
          aria-pressed={following}
          onClick={() => setFollowing((v) => !v)}
        >
          {following ? "Following" : "Follow"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function Podium({ top3 }: { top3: RankingEntry[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {top3.map((entry, i) => (
        <PodiumCard key={entry.handle} entry={entry} rank={i + 1} />
      ))}
    </div>
  );
}
