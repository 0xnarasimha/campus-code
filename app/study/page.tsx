"use client";

import { useMemo, useState } from "react";
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
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <HubStories hubs={hubs} active={hub} onSelect={setHub} />
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((spot) => (
          <SpotCard key={spot.id} spot={spot} />
        ))}
      </div>
    </div>
  );
}
