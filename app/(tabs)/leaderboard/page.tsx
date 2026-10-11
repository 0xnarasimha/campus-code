"use client";

import { useEffect, useMemo, useState } from "react";
import { Podium } from "@/components/leaderboard/Podium";
import { RankingRow } from "@/components/leaderboard/RankingRow";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getFollowInfo, type FollowInfo } from "@/lib/actions/social";
import {
  rankingsAllTime,
  rankingsMonthly,
  rankingsWeekly,
  type RankingRow as RankingEntry,
} from "@/lib/mock-data";
import { useSimulatedLoad } from "@/lib/use-simulated-load";

type Period = "weekly" | "monthly" | "alltime";

const periods: { key: Period; label: string }[] = [
  { key: "weekly", label: "This Week" },
  { key: "monthly", label: "Monthly" },
  { key: "alltime", label: "All-Time" },
];

const dataByPeriod: Record<Period, RankingEntry[]> = {
  weekly: rankingsWeekly,
  monthly: rankingsMonthly,
  alltime: rankingsAllTime,
};

function LeaderboardBody({ period, query }: { period: Period; query: string }) {
  const loading = useSimulatedLoad(500);
  const data = dataByPeriod[period];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (e) =>
        e.handle.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q)
    );
  }, [data, query]);

  // Real follow state + privacy per visible handle (leaderboard rows are
  // otherwise mock data). `follows` only exposes info for the current
  // filter — anything else reads as not-yet-loaded, so buttons never flash
  // a wrong Follow/Following label. Async callbacks (not the effect body)
  // set state, per the set-state-in-effect rule.
  const [cached, setCached] = useState<{
    key: string;
    info: Record<string, FollowInfo>;
  } | null>(null);
  const filterKey = `${period}:${query}`;
  useEffect(() => {
    let cancelled = false;
    void getFollowInfo(filtered.map((e) => e.handle)).then((info) => {
      if (!cancelled) setCached({ key: filterKey, info });
    });
    return () => {
      cancelled = true;
    };
  }, [filtered, filterKey]);
  const follows = cached?.key === filterKey ? cached.info : null;

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ig-secondary">
        No developers match “{query}”.
      </p>
    );
  }

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3, 10);

  return (
    <div className="flex flex-col gap-3">
      <Podium top3={top3} follows={follows ?? undefined} />
      {rest.map((entry) => (
        <RankingRow
          key={entry.handle}
          entry={entry}
          rank={entry.rank}
          follow={follows?.[entry.handle]}
        />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [query, setQuery] = useState("");

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div
        role="tablist"
        aria-label="Leaderboard period"
        className="flex gap-1 rounded-xl bg-ig-subtle p-1 dark:bg-white/10"
      >
        {periods.map((p) => (
          <Button
            key={p.key}
            role="tab"
            aria-selected={period === p.key}
            variant={period === p.key ? "primary" : "ghost"}
            size="sm"
            className={cn("flex-1", period !== p.key && "text-ig-secondary")}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by handle or name…"
        aria-label="Search leaderboard"
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none placeholder:text-muted focus:border-ig-blue"
      />
      <LeaderboardBody key={period} period={period} query={query} />
    </div>
  );
}
