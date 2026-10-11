"use client";

import { useState } from "react";
import { toggleFollow, type FollowState } from "@/lib/actions/social";

export const FOLLOW_LABEL: Record<FollowState, string> = {
  none: "Follow",
  pending: "Requested",
  accepted: "Following",
};

// Three-state follow toggle (none → pending → accepted) shared by profile
// headers, feed cards, and leaderboard buttons. Not optimistic: the label
// only changes after the server confirms (pending vs accepted matters).
export function useFollowToggle(handle: string, initial: FollowState) {
  const [state, setState] = useState<FollowState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Server-provided initial can land after mount (leaderboard loads follow
  // info async). Render-time adjustment: resync only when the incoming
  // prop itself changes. Local toggles update `state` without touching
  // `initial`, so this never clobbers them.
  const [prevKey, setPrevKey] = useState(`${handle} ${initial}`);
  const key = `${handle} ${initial}`;
  if (key !== prevKey) {
    setPrevKey(key);
    setState(initial);
  }

  async function toggle(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await toggleFollow(handle);
      if (!res.ok) {
        setError(res.error);
      } else {
        setState(
          res.following ? "accepted" : res.requested ? "pending" : "none"
        );
      }
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setBusy(false);
    }
  }

  return { state, error, busy, toggle };
}
