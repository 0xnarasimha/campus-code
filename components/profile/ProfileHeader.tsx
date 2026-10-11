"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Link2, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFollow } from "@/lib/actions/social";
import type { Profile } from "@/lib/mock-data";

export function ProfileHeader({
  profile,
  isOwn = false,
  onEdit,
}: {
  profile: Profile;
  isOwn?: boolean;
  onEdit?: () => void;
}) {
  const [following, setFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onToggleFollow() {
    const prev = following;
    setFollowing(!prev);
    setError(null);
    try {
      const res = await toggleFollow(profile.handle);
      if (!res.ok) {
        setFollowing(prev);
        setError(res.error);
      } else {
        setFollowing(res.following);
      }
    } catch {
      setFollowing(prev);
      setError("Something went wrong, try again");
    }
  }
  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const stats: Array<{ label: string; value: number }> = [
    { label: "posts", value: profile.stats.posts },
    { label: "followers", value: profile.stats.followers + (following ? 1 : 0) },
    { label: "following", value: profile.stats.following },
  ];

  const metaLine = [profile.year, profile.branch].filter(Boolean).join(" · ");

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-5">
        <div
          aria-label="Avatar with story ring"
          className="rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-500 p-[3px]"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ig-subtle text-xl font-bold text-ig-text dark:bg-zinc-900 dark:text-white">
            {initials}
          </div>
        </div>
        <dl className="flex flex-1 items-center justify-around text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-base font-bold text-ig-text dark:text-white">
                {s.value.toLocaleString()}
              </dd>
              <dd className="text-xs text-ig-secondary">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-ig-text dark:text-white">
          <span>@{profile.handle}</span>
          <BadgeCheck className="h-4 w-4 text-ig-blue" aria-label="Verified" />
        </div>
        <p className="text-sm font-medium text-ig-text dark:text-white">
          {profile.name}
          {metaLine ? ` · ${metaLine}` : ""}
        </p>
        <p className="mt-1 text-sm text-ig-text dark:text-white/90">{profile.bio}</p>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-ig-blue"
        >
          <Link2 className="h-4 w-4" />
          github.com/{profile.handle}
        </a>
      </div>

      <div className="flex gap-2">
        {isOwn ? (
          <>
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 rounded-lg bg-ig-blue px-4 py-2 text-sm font-semibold text-white"
            >
              Edit profile
            </button>
            <button
              type="button"
              aria-label="Share profile"
              className="flex items-center gap-1.5 rounded-lg bg-ig-subtle px-4 py-2 text-sm font-semibold text-ig-text dark:bg-white/10 dark:text-white"
            >
              <Share className="h-4 w-4" />
              Share
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void onToggleFollow()}
              aria-pressed={following}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-semibold",
                following
                  ? "bg-ig-subtle text-ig-text dark:bg-white/10 dark:text-white"
                  : "bg-ig-blue text-white"
              )}
            >
              {following ? "Following" : "Follow"}
            </button>
            <Link
              href="/messages"
              aria-label={`Message ${profile.handle}`}
              className="flex flex-1 items-center justify-center rounded-lg bg-ig-subtle px-4 py-2 text-sm font-semibold text-ig-text dark:bg-white/10 dark:text-white"
            >
              Message
            </Link>
          </>
        )}
      </div>
      {!isOwn && error && (
        <p role="alert" className="text-xs text-rose-500">
          {error}
        </p>
      )}
    </section>
  );
}
