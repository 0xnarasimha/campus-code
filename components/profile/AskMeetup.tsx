"use client";

import { useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { requestMeetup } from "@/lib/actions/meetups";

const PRESETS = ["Central Library", "Terrace Cafe", "Innovation Hub", "Custom idea…"] as const;

export function AskMeetup({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<string>(PRESETS[0]);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const place = preset === "Custom idea…" ? custom.trim() : preset;

  async function submit() {
    if (!place) {
      setError("Pick a place or describe your idea.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await requestMeetup({ handle, place, note });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  function close() {
    setOpen(false);
    // Reset for next open, but keep the success state visible while open.
    setTimeout(() => {
      setDone(false);
      setError(null);
      setNote("");
      setCustom("");
      setPreset(PRESETS[0]);
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ask ${handle} for meetup`}
        className="w-full rounded-lg bg-ig-blue px-4 py-2 text-sm font-semibold text-white"
      >
        Ask for meetup
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ask for meetup"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CalendarCheck className="h-8 w-8 text-green-500" />
                <p className="text-base font-bold text-ig-text dark:text-white">
                  Request sent
                </p>
                <p className="text-sm text-ig-secondary">
                  Find it in Messages — we dropped it into your DM thread with @
                  {handle}.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-2 rounded-lg bg-ig-blue px-4 py-2 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-base font-bold text-ig-text dark:text-white">
                  Meet @{handle}
                </h2>
                <p className="mt-0.5 text-sm text-ig-secondary">
                  Pick a spot and add a note. They confirm from Messages.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPreset(p)}
                      aria-pressed={preset === p}
                      className={
                        preset === p
                          ? "rounded-full bg-ig-blue px-3 py-1.5 text-sm font-semibold text-white"
                          : "rounded-full border border-ig-border px-3 py-1.5 text-sm font-medium text-ig-secondary dark:border-white/10"
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {preset === "Custom idea…" && (
                  <input
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="e.g. CSE Block B, Lab 4 at 6pm"
                    aria-label="Custom place"
                    maxLength={120}
                    className="mt-3 h-11 w-full rounded-lg bg-ig-subtle px-3 text-sm text-ig-text outline-none placeholder:text-ig-secondary dark:bg-white/10 dark:text-white"
                  />
                )}

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note (optional) — what do you want to work on?"
                  aria-label="Meetup note"
                  rows={3}
                  maxLength={500}
                  className="mt-3 w-full rounded-lg bg-ig-subtle px-3 py-2 text-sm text-ig-text outline-none placeholder:text-ig-secondary dark:bg-white/10 dark:text-white"
                />

                {error && (
                  <p role="alert" className="mt-2 text-sm text-red-500">
                    {error}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 rounded-lg bg-ig-subtle px-4 py-2 text-sm font-semibold text-ig-text dark:bg-white/10 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ig-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
