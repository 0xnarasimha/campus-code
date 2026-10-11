"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ChevronDown, MapPin, Plus, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  createEvent,
  getClubs,
  getUpcomingEvents,
  registerClub,
  toggleRsvp,
  type ClubCard as ClubCardData,
  type UpcomingEvent,
} from "@/lib/actions/clubs";

function formatEventDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function toDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ModalShell({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-bold text-ig-text dark:text-white">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="rounded-full p-1.5 text-ig-secondary hover:bg-ig-subtle dark:hover:bg-white/10"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

const inputClass =
  "h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none placeholder:text-muted focus:border-ig-blue";

function RegisterClubModal({
  onClose,
  onRegistered,
}: {
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    setError(null);
    setSaving(true);
    const res = await registerClub({ name, description });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onRegistered();
    onClose();
  }

  return (
    <ModalShell label="Register a club" onClose={onClose}>
      <ModalHeader title="Register a club" onClose={onClose} />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ig-secondary">
          Club name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Robotics Club"
          aria-label="Club name"
          maxLength={60}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ig-secondary">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this club about?"
          aria-label="Club description"
          maxLength={500}
          rows={3}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-ig-blue"
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-rose-500">
          {error}
        </p>
      )}
      <Button onClick={() => void onSubmit()} disabled={saving} className="w-full">
        {saving ? "Registering…" : "Register club"}
      </Button>
    </ModalShell>
  );
}

function AddEventModal({
  club,
  onClose,
  onCreated,
}: {
  club: ClubCardData;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() =>
    toDateTimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000))
  );
  const [venue, setVenue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const parsedDate = new Date(date);
  const dateValid = date.trim() !== "" && !Number.isNaN(parsedDate.getTime());

  async function onSubmit() {
    if (!dateValid) {
      setError("Pick a valid event date.");
      return;
    }
    setError(null);
    setSaving(true);
    const res = await createEvent({
      clubId: club.id,
      title,
      dateISO: parsedDate.toISOString(),
      venue,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onCreated();
    onClose();
  }

  return (
    <ModalShell label={`Add event to ${club.name}`} onClose={onClose}>
      <ModalHeader title={`Add event · ${club.name}`} onClose={onClose} />
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ig-secondary">
          Event title
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Intro to Soldering"
          aria-label="Event title"
          maxLength={120}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ig-secondary">
          Date
        </span>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Event date"
          className={cn(inputClass, "dark:[color-scheme:dark]")}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ig-secondary">
          Venue
        </span>
        <input
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="e.g. Innovation Hub · Room 2"
          aria-label="Event venue"
          maxLength={200}
          className={inputClass}
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-rose-500">
          {error}
        </p>
      )}
      <Button
        onClick={() => void onSubmit()}
        disabled={saving || !dateValid}
        className="w-full"
      >
        {saving ? "Creating…" : "Create event"}
      </Button>
    </ModalShell>
  );
}

function ClubEventRow({
  event,
  rsvping,
  onToggle,
}: {
  event: UpcomingEvent;
  rsvping: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-ig-subtle px-3 py-2 dark:bg-white/5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ig-text dark:text-white">
          {event.title}
        </p>
        <p className="flex items-center gap-2 truncate text-xs text-ig-secondary">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {formatEventDate(event.date)}
          </span>
          {event.venue && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </span>
          )}
        </p>
      </div>
      <Button
        variant={event.myRsvp ? "secondary" : "primary"}
        size="sm"
        className="shrink-0"
        aria-pressed={event.myRsvp}
        disabled={rsvping}
        onClick={onToggle}
      >
        {event.myRsvp ? `Going · ${event.rsvpCount}` : `RSVP · ${event.rsvpCount}`}
      </Button>
    </div>
  );
}

function ClubCard({
  club,
  events,
  expanded,
  rsvpingId,
  onToggleExpand,
  onToggleRsvp,
  onAddEvent,
}: {
  club: ClubCardData;
  events: UpcomingEvent[];
  expanded: boolean;
  rsvpingId: string | null;
  onToggleExpand: () => void;
  onToggleRsvp: (eventId: string) => void;
  onAddEvent: () => void;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="flex min-h-[240px] flex-col gap-4 p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ig-blue/10 text-lg font-bold text-ig-blue dark:bg-ig-blue/20"
          >
            {club.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-lg font-bold leading-snug text-ig-text dark:text-white">
              {club.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-ig-secondary">
              {club.description || "No description yet."}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge className="gap-1">
                <Users className="h-3 w-3" />
                {club.memberCount} member{club.memberCount === 1 ? "" : "s"}
              </Badge>
              <Badge>
                {club.eventCount} event{club.eventCount === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full flex-1"
            aria-expanded={expanded}
            onClick={onToggleExpand}
          >
            {expanded ? "Hide events" : "View events"}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
            />
          </Button>
          <Button variant="ghost" size="sm" className="w-full flex-1" onClick={onAddEvent} aria-label={`Add event to ${club.name}`}>
            <Plus className="h-4 w-4" />
            Add event
          </Button>
        </div>

        {expanded && (
          <div className="flex flex-col gap-2">
            {events.length === 0 ? (
              <p className="text-xs text-ig-secondary">No upcoming events.</p>
            ) : (
              events.map((event) => (
                <ClubEventRow
                  key={event.id}
                  event={event}
                  rsvping={rsvpingId === event.id}
                  onToggle={() => onToggleRsvp(event.id)}
                />
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ClubsTab() {
  const [clubs, setClubs] = useState<ClubCardData[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rsvpingId, setRsvpingId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [addEventClub, setAddEventClub] = useState<ClubCardData | null>(null);

  const refresh = useCallback(async () => {
    const [c, e] = await Promise.all([getClubs(), getUpcomingEvents()]);
    setClubs(c);
    setEvents(e);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function onToggleRsvp(eventId: string) {
    setRsvpingId(eventId);
    const res = await toggleRsvp(eventId);
    setRsvpingId(null);
    if (!res.ok) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, myRsvp: res.rsvped, rsvpCount: res.count }
          : e
      )
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-60 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setRegisterOpen(true)}>
          <Plus className="h-4 w-4" />
          Register club
        </Button>
      </div>
      {clubs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-sm font-semibold text-ig-text dark:text-white">
              No clubs yet
            </p>
            <p className="text-xs text-ig-secondary">
              Be the first to register a club for your campus.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {clubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              events={events.filter((e) => e.clubName === club.name)}
              expanded={expandedId === club.id}
              rsvpingId={rsvpingId}
              onToggleExpand={() =>
                setExpandedId((prev) => (prev === club.id ? null : club.id))
              }
              onToggleRsvp={(eventId) => void onToggleRsvp(eventId)}
              onAddEvent={() => setAddEventClub(club)}
            />
          ))}
        </div>
      )}
      {registerOpen && (
        <RegisterClubModal
          onClose={() => setRegisterOpen(false)}
          onRegistered={() => void refresh()}
        />
      )}
      {addEventClub && (
        <AddEventModal
          club={addEventClub}
          onClose={() => setAddEventClub(null)}
          onCreated={() => void refresh()}
        />
      )}
    </div>
  );
}
