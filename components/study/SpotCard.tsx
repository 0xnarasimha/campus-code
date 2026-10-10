"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Spot } from "@/lib/mock-data";
import {
  Coffee,
  Monitor,
  PlugZap,
  Presentation,
  VolumeX,
  Wifi,
} from "lucide-react";

function amenityIcon(amenity: string) {
  const a = amenity.toLowerCase();
  if (a.includes("wi-fi") || a.includes("wifi")) return Wifi;
  if (a.includes("power") || a.includes("outlet") || a.includes("plug"))
    return PlugZap;
  if (
    a.includes("monitor") ||
    a.includes("desktop") ||
    a.includes("projector")
  )
    return Monitor;
  if (a.includes("whiteboard") || a.includes("board")) return Presentation;
  return Coffee;
}

function occupancyColor(pct: number): string {
  if (pct < 70) return "bg-green-500";
  if (pct < 90) return "bg-amber-500";
  return "bg-red-500";
}

export function SpotCard({ spot }: { spot: Spot }) {
  const [reserved, setReserved] = useState(false);
  const pct =
    spot.capacity > 0
      ? Math.min(100, Math.round((spot.occupancy / spot.capacity) * 100))
      : 0;

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className={cn("h-1.5 w-full bg-gradient-to-r", spot.gradient)} />
      <CardContent className="flex flex-col gap-3">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ig-text dark:text-white">
              {spot.name}
            </h3>
            <p className="truncate text-xs text-ig-secondary">{spot.building}</p>
          </div>
          <Badge className="animate-float-soft shrink-0">{spot.openSeats} seats</Badge>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-ig-secondary">
            <span>
              {spot.occupancy}/{spot.capacity} occupied
            </span>
            <span>{pct}%</span>
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
              className={cn("h-full rounded-full", occupancyColor(pct))}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <VolumeX className="h-3.5 w-3.5 shrink-0 text-ig-secondary" />
          <div className="flex items-center gap-1" aria-label={`Quietness ${spot.quietness} of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i < spot.quietness
                    ? "bg-ig-blue"
                    : "bg-ig-border dark:bg-white/15"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {spot.amenities.map((amenity) => {
            const Icon = amenityIcon(amenity);
            return (
              <Badge key={amenity} className="gap-1">
                <Icon className="h-3 w-3" />
                {amenity}
              </Badge>
            );
          })}
        </div>

        <Button
          variant={reserved ? "secondary" : "primary"}
          size="sm"
          className="w-full"
          aria-pressed={reserved}
          onClick={() => setReserved((v) => !v)}
        >
          {reserved ? "Reserved" : "Reserve"}
        </Button>
      </CardContent>
    </Card>
  );
}
