"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ActivityRail } from "@/components/study/ActivityRail";
import { CreateHubModal } from "@/components/study/CreateHubModal";
import { HubStories } from "@/components/study/HubStories";
import { SpotCard } from "@/components/study/SpotCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { spots, type Spot } from "@/lib/mock-data";
import type { CreatedSpot } from "@/lib/actions/spots";
import { useSimulatedLoad } from "@/lib/use-simulated-load";

function toCardSpot(spot: CreatedSpot): Spot {
  return {
    id: spot.id,
    name: spot.name,
    building: spot.building,
    occupancy: spot.occupancy,
    capacity: spot.capacity,
    quietness: spot.quietness,
    amenities: spot.amenities,
    openSeats: spot.openSeats,
    active: true,
    gradient: "from-sky-400 to-blue-600",
  };
}

export default function StudyPage() {
  const loading = useSimulatedLoad(800);
  const [hub, setHub] = useState("All Hubs");
  const [allSpots, setAllSpots] = useState<Spot[]>(spots);
  const [modalOpen, setModalOpen] = useState(false);

  const hubs = useMemo(
    () => Array.from(new Set(allSpots.map((s) => s.building))),
    [allSpots]
  );

  const filtered =
    hub === "All Hubs" ? allSpots : allSpots.filter((s) => s.building === hub);

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
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create your own
        </Button>
      </div>
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
      <CreateHubModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(spot) => setAllSpots((prev) => [toCardSpot(spot), ...prev])}
      />
    </div>
  );
}
