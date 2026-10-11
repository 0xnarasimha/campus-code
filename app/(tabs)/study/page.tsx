"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ActivityRail } from "@/components/study/ActivityRail";
import { ClubsTab } from "@/components/study/ClubsTab";
import { CreateHubModal } from "@/components/study/CreateHubModal";
import { HubStories } from "@/components/study/HubStories";
import { SpotCard } from "@/components/study/SpotCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

type StudyTab = "hubs" | "clubs";

const TABS: { id: StudyTab; label: string }[] = [
  { id: "hubs", label: "Hubs" },
  { id: "clubs", label: "Clubs" },
];

export default function StudyPage() {
  const loading = useSimulatedLoad(800);
  const [tab, setTab] = useState<StudyTab>("hubs");
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
      <div
        role="tablist"
        aria-label="Study sections"
        className="flex gap-1 rounded-xl bg-ig-subtle p-1 dark:bg-white/10"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "h-9 flex-1 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] sm:flex-none sm:px-8",
              tab === t.id
                ? "bg-surface text-ig-text shadow-sm dark:bg-white/15 dark:text-white"
                : "text-ig-secondary hover:text-ig-text dark:hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hubs" ? (
        <>
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
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <ClubsTab />
          </div>
          <aside className="hidden lg:block" aria-label="Study activity">
            <div className="sticky top-4">
              <ActivityRail />
            </div>
          </aside>
        </div>
      )}
      <CreateHubModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(spot) => setAllSpots((prev) => [toCardSpot(spot), ...prev])}
      />
    </div>
  );
}
