import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PostGrid } from "@/components/profile/PostGrid";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import type { Profile } from "@/lib/mock-data";

// Dynamic handle: URL data (AppShell usePathname) is only available at
// request time, so this segment opts out of instant-navigation validation
// and renders blocking per handle.
export const instant = false;

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const session = await auth();

  // Own handle resolves to the private profile page.
  if (session?.user?.handle === handle) redirect("/profile");

  const user = await db.user.findUnique({
    where: { handle },
    include: {
      _count: { select: { posts: true, followers: true, following: true } },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          topic: true,
          location: true,
          tags: true,
          codeLang: true,
        },
      },
    },
  });

  if (!user) notFound();

  const tagCounts = new Map<string, number>();
  for (const p of user.posts) {
    for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const highlights = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t);

  const profile: Profile = {
    handle: user.handle,
    name: user.name,
    bio: user.bio,
    stats: {
      posts: user._count.posts,
      followers: user._count.followers,
      following: user._count.following,
    },
    highlights: highlights.length > 0 ? highlights : ["Posts"],
    grid: user.posts.map((p) => ({
      id: p.id,
      title: p.topic,
      meta:
        [p.codeLang, p.location].filter(Boolean).join(" · ") ||
        (p.tags[0] ? `#${p.tags[0]}` : "Post"),
    })),
  };

  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <ProfileHeader profile={profile} />

      <button
        type="button"
        disabled
        title="coming in batch 3"
        aria-label="Ask for meetup (coming soon)"
        className="w-full cursor-not-allowed rounded-lg bg-ig-subtle px-4 py-2 text-sm font-semibold text-ig-secondary opacity-60 dark:bg-white/10 dark:text-white/60"
      >
        Ask for meetup
      </button>

      <PostGrid items={profile.grid} />
    </div>
  );
}
