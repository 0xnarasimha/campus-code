"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSpot, type CreatedSpot } from "@/lib/actions/spots";

const BUILDING_PRESETS = [
  "Central Library",
  "CSE Block",
  "Terrace Cafe",
  "Innovation Hub",
  "Civil Block",
  "Custom",
] as const;

const AMENITY_PRESETS = [
  "Wi-Fi",
  "Power outlets",
  "Whiteboard",
  "Coffee",
  "Desktops",
  "Projector",
  "Soundproof",
  "Lockers",
] as const;

interface CreateHubModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (spot: CreatedSpot) => void;
}

export function CreateHubModal({ open, onClose, onCreated }: CreateHubModalProps) {
  const [name, setName] = useState("");
  const [building, setBuilding] = useState<(typeof BUILDING_PRESETS)[number]>(
    BUILDING_PRESETS[0]
  );
  const [customBuilding, setCustomBuilding] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [quietness, setQuietness] = useState(3);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function toggleAmenity(a: string) {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a].slice(0, 8)
    );
  }

  async function onSubmit() {
    setError(null);
    setSaving(true);
    const res = await createSpot({
      name,
      building: building === "Custom" ? customBuilding : building,
      capacity,
      quietness,
      amenities,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onCreated(res.spot);
    setName("");
    setBuilding(BUILDING_PRESETS[0]);
    setCustomBuilding("");
    setCapacity(4);
    setQuietness(3);
    setAmenities([]);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
      aria-hidden={false}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create your own hub"
        className="flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ig-text dark:text-white">
            Create your own hub
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ig-secondary hover:bg-ig-subtle dark:hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ig-secondary">
            Hub name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Night Owl Corner"
            aria-label="Hub name"
            maxLength={60}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none placeholder:text-muted focus:border-ig-blue"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-ig-secondary">
            Building
          </span>
          <select
            value={building}
            onChange={(e) =>
              setBuilding(e.target.value as typeof building)
            }
            aria-label="Building"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-ig-blue"
          >
            {BUILDING_PRESETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        {building === "Custom" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ig-secondary">
              Custom building
            </span>
            <input
              value={customBuilding}
              onChange={(e) => setCustomBuilding(e.target.value)}
              placeholder="e.g. ECE Block · Room 12"
              aria-label="Custom building"
              maxLength={80}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none placeholder:text-muted focus:border-ig-blue"
            />
          </label>
        )}

        <div className="flex items-center justify-between">
          <span
            id="capacity-label"
            className="text-xs font-semibold uppercase tracking-wide text-ig-secondary"
          >
            Capacity
          </span>
          <div
            className="flex items-center gap-2"
            role="group"
            aria-labelledby="capacity-label"
          >
            <Button
              variant="secondary"
              size="sm"
              aria-label="Decrease capacity"
              disabled={capacity <= 1}
              onClick={() => setCapacity((c) => Math.max(1, c - 1))}
            >
              −
            </Button>
            <span
              aria-live="polite"
              className="w-8 text-center font-mono text-sm font-bold text-ig-text dark:text-white"
            >
              {capacity}
            </span>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Increase capacity"
              disabled={capacity >= 200}
              onClick={() => setCapacity((c) => Math.min(200, c + 1))}
            >
              +
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span
            id="quietness-label"
            className="text-xs font-semibold uppercase tracking-wide text-ig-secondary"
          >
            Quietness
          </span>
          <div
            className="flex items-center gap-2"
            role="radiogroup"
            aria-labelledby="quietness-label"
          >
            {Array.from({ length: 5 }, (_, i) => i + 1).map((q) => (
              <button
                key={q}
                type="button"
                role="radio"
                aria-checked={quietness === q}
                aria-label={`Quietness ${q} of 5`}
                onClick={() => setQuietness(q)}
                className={cn(
                  "h-4 w-4 rounded-full transition-transform hover:scale-125",
                  q <= quietness
                    ? "bg-ig-blue"
                    : "bg-ig-border dark:bg-white/15"
                )}
              />
            ))}
            <span className="ml-1 text-xs text-ig-secondary">{quietness}/5</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span
            id="amenities-label"
            className="text-xs font-semibold uppercase tracking-wide text-ig-secondary"
          >
            Amenities ({amenities.length}/8)
          </span>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-labelledby="amenities-label"
          >
            {AMENITY_PRESETS.map((a) => {
              const on = amenities.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                    on
                      ? "bg-ig-blue text-white"
                      : "bg-ig-subtle text-ig-secondary hover:bg-ig-border dark:bg-white/10 dark:text-white/80"
                  )}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-rose-500">
            {error}
          </p>
        )}

        <Button onClick={() => void onSubmit()} disabled={saving} className="w-full">
          {saving ? "Creating…" : "Create hub"}
        </Button>
      </div>
    </div>
  );
}
