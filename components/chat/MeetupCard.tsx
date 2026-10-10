"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Loader2, MapPin } from "lucide-react";
import {
  getMeetup,
  respondMeetup,
  type MeetupDTO,
} from "@/lib/actions/meetups";
import { cn } from "@/lib/utils";

// Renders inside the ChatWindow thread for any message carrying a
// [meetup:<id>] marker. Loads the request row (place/note/status) and, for
// the recipient while pending, offers optimistic Accept/Decline.
export function MeetupCard({ meetupId }: { meetupId: string }) {
  const [meetup, setMeetup] = useState<MeetupDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);

  useEffect(() => {
    let live = true;
    getMeetup(meetupId).then((res) => {
      if (!live) return;
      if (res.ok) setMeetup(res.meetup);
      else setError(res.error);
    });
    return () => {
      live = false;
    };
  }, [meetupId]);

  async function respond(accept: boolean) {
    const prev = meetup;
    setBusy(accept ? "accept" : "decline");
    // Optimistic status flip; rolled back on failure.
    setMeetup((m) => (m ? { ...m, status: accept ? "accepted" : "declined", canRespond: false } : m));
    const res = await respondMeetup({ id: meetupId, accept });
    setBusy(null);
    if (!res.ok) {
      setMeetup(prev);
      setError(res.error);
    } else {
      setMeetup((m) => (m ? { ...m, status: res.status } : m));
    }
  }

  if (error && !meetup) {
    return (
      <div className="rounded-2xl border border-ig-border p-3 text-sm text-ig-secondary dark:border-white/10">
        Meetup request unavailable ({error})
      </div>
    );
  }
  if (!meetup) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-ig-border p-3 text-sm text-ig-secondary dark:border-white/10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading meetup…
      </div>
    );
  }

  const statusLabel =
    meetup.status === "pending"
      ? "Pending"
      : meetup.status === "accepted"
        ? "Accepted"
        : "Declined";

  return (
    <div
      data-meetup-id={meetup.id}
      data-meetup-status={meetup.status}
      className="rounded-2xl border border-ig-border bg-surface p-3 dark:border-white/10"
    >
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0 text-ig-blue" />
        <p className="truncate text-sm font-bold text-ig-text dark:text-white">
          {meetup.place}
        </p>
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
            meetup.status === "accepted" && "bg-green-500/15 text-green-600",
            meetup.status === "declined" && "bg-red-500/15 text-red-500",
            meetup.status === "pending" && "bg-ig-subtle text-ig-secondary dark:bg-white/10"
          )}
        >
          {statusLabel}
        </span>
      </div>
      {meetup.note && (
        <p className="mt-1 text-sm text-ig-secondary">{meetup.note}</p>
      )}
      <p className="mt-1 text-xs text-ig-secondary">
        @{meetup.requesterHandle} → @{meetup.recipientHandle}
      </p>

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}

      {meetup.canRespond ? (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => respond(true)}
            disabled={busy !== null}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-ig-blue px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy === "accept" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Accept
          </button>
          <button
            type="button"
            onClick={() => respond(false)}
            disabled={busy !== null}
            className="flex-1 rounded-lg bg-ig-subtle px-3 py-1.5 text-sm font-semibold text-ig-text disabled:opacity-60 dark:bg-white/10 dark:text-white"
          >
            {busy === "decline" ? "…" : "Decline"}
          </button>
        </div>
      ) : (
        meetup.status === "accepted" && (
          <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
            <CalendarCheck className="h-3.5 w-3.5" />
            Meetup accepted — see you at {meetup.place}.{" "}
            <Link href="/messages" className="underline">
              Messages
            </Link>
          </p>
        )
      )}
    </div>
  );
}
