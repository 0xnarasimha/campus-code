import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OwnProfileView } from "@/components/profile/OwnProfileView";
import type { Profile } from "@/lib/mock-data";

// Own profile: resolved from the session user id (never a hardcoded or
// seeded handle). Loads handle/bio/name/year/branch plus real counts.
//
// Session data is only available at request time, so like the [handle]
// segment this page opts out of instant-navigation validation and
// renders blocking per session.
export const instant = false;

export default async function ProfilePage() {  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?callbackUrl=%2Fprofile");

  const user = await db.user.findUnique({
    where: { id: userId },
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

  // Session valid but user row gone (deleted): force a fresh login.
  if (!user) redirect("/login?callbackUrl=%2Fprofile");

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
    year: user.year,
    branch: user.branch,
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
    <OwnProfileView
      profile={profile}
      initial={{
        handle: user.handle,
        name: user.name,
        bio: user.bio,
        year: user.year,
        branch: user.branch,
      }}
    />
  );
}
