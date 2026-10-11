"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { respondFollow } from "@/lib/actions/social";

export interface FollowRequest {
  handle: string;
  name: string;
  initials: string;
}

// Incoming pending follows on the own profile: Accept makes the row
// accepted, Decline deletes it. Removed from the list on success;
// router.refresh() revalidates the server counts.
export function FollowRequests({
  initial,
}: {
  initial: FollowRequest[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(handle: string, accept: boolean) {
    if (busy) return;
    setBusy(handle);
    setError(null);
    try {
      const res = await respondFollow({ handle, accept });
      if (!res.ok) {
        setError(res.error);
      } else {
        setRequests((prev) => prev.filter((r) => r.handle !== handle));
        router.refresh();
      }
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <section aria-label="Follow requests" className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-ig-text dark:text-white">
        Follow requests · {requests.length}
      </h2>
      <ul className="flex flex-col gap-2">
        {requests.map((r) => (
          <li
            key={r.handle}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
          >
            <Avatar name={r.initials} className="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ig-text dark:text-white">
                {r.name}
              </p>
              <p className="truncate text-xs text-ig-secondary">@{r.handle}</p>
            </div>
            <Button
              size="sm"
              disabled={busy === r.handle}
              onClick={() => void respond(r.handle, true)}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy === r.handle}
              onClick={() => void respond(r.handle, false)}
            >
              Decline
            </Button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-xs text-rose-500">
          {error}
        </p>
      )}
    </section>
  );
}
