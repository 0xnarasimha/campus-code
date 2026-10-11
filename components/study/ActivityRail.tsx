"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { spots, type Spot } from "@/lib/mock-data";
import { getUpcomingEvents, type UpcomingEvent } from "@/lib/actions/clubs";

const peakHours = ["Peak 6–9 PM", "Peak 4–8 PM", "Peak 7–10 PM"];

function occupancyPct(spot: Spot): number {
  return spot.capacity > 0
    ? Math.min(100, Math.round((spot.occupancy / spot.capacity) * 100))
    : 0;
}

function ringColor(pct: number): string {
  if (pct < 70) return "stroke-green-500";
  if (pct < 90) return "stroke-amber-500";
  return "stroke-red-500";
}

function OccupancyRing({ pct, label }: { pct: number; label: string }) {
  const r = 15.5;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      role="img"
      aria-label={`${label} ${pct}% occupied`}
      className="-rotate-90"
    >
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        className="stroke-ig-subtle dark:stroke-white/10"
        strokeWidth="5"
      />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        className={ringColor(pct)}
      />
    </svg>
  );
}

export function ActivityRail() {
  const active = spots.filter((s) => s.active);
  const ongoing = [...active]
    .sort((a, b) => occupancyPct(b) - occupancyPct(a))
    .slice(0, 3);
  const popular = [...active]
    .sort((a, b) => b.occupancy - a.occupancy)
    .slice(0, 3);
  const [events, setEvents] = useState<UpcomingEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const upcoming = await getUpcomingEvents();
      if (!cancelled) setEvents(upcoming.slice(0, 5));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function eventDetail(event: UpcomingEvent): string {
    const d = event.date instanceof Date ? event.date : new Date(event.date);
    const when = Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return [when, event.venue || event.clubName].filter(Boolean).join(" · ");
  }

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ig-text dark:text-white">
            Ongoing reservations
          </h2>
          {ongoing.map((spot) => {
            const pct = occupancyPct(spot);
            return (
              <div key={spot.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ig-text dark:text-white">
                      {spot.name}
                    </p>
                    <p className="truncate text-xs text-ig-secondary">
                      {spot.building}
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-ig-blue/10 text-ig-blue dark:bg-ig-blue/20">
                    {pct}%
                  </Badge>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-ig-subtle dark:bg-white/10"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${spot.name} occupancy`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full",
                      pct < 70
                        ? "bg-green-500"
                        : pct < 90
                          ? "bg-amber-500"
                          : "bg-red-500"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ig-text dark:text-white">
            Popular Hubs
          </h2>
          {popular.map((spot, i) => {
            const pct = occupancyPct(spot);
            return (
              <div key={spot.id} className="flex items-center gap-3">
                <OccupancyRing pct={pct} label={spot.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ig-text dark:text-white">
                    {spot.name}
                  </p>
                  <p className="truncate text-xs text-ig-secondary">
                    {spot.building}
                  </p>
                  <p className="text-xs font-medium text-ig-blue">
                    {peakHours[i % peakHours.length]}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ig-text dark:text-white">
            Upcoming Events
          </h2>
          {events === null ? (
            <div className="flex flex-col gap-2.5" aria-label="Loading upcoming events">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-xs text-ig-secondary">No upcoming events.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {events.map((event) => (
                <li key={event.id} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ig-blue"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ig-text dark:text-white">
                      {event.title}
                    </p>
                    <p className="truncate text-xs text-ig-secondary">
                      {eventDetail(event)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
