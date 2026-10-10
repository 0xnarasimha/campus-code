"use client";

import { useMemo, useState } from "react";
import { ActivityRail } from "@/components/study/ActivityRail";
import { HubStories } from "@/components/study/HubStories";
import { SpotCard } from "@/components/study/SpotCard";
import { Skeleton } from "@/components/ui/skeleton";
import { spots } from "@/lib/mock-data";
import { useSimulatedLoad } from "@/lib/use-simulated-load";

export default function StudyPage() {
  const loading = useSimulatedLoad(800);
  const [hub, setHub] = useState("All Hubs");

  const hubs = useMemo(
    () => Array.from(new Set(spots.map((s) => s.building))),
    []
  );

  const filtered =
    hub === "All Hubs" ? spots : spots.filter((s) => s.building === hub);

  if (loading) {
    return (
      <div className="animate-fade-up mx-auto flex w-full max-w-6xl flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-6xl flex-col gap-4">
      <HubStories hubs={hubs} active={hub} onSelect={setHub} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-2">
          {filtered.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
        <aside className="hidden lg:block" aria-label="Study activity">
          <div className="sticky top-4">
            <ActivityRail />
          </div>
        </aside>
      </div>
    </div>
  );
}
