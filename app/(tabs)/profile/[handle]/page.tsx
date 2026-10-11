import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PostGrid } from "@/components/profile/PostGrid";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { AskMeetup } from "@/components/profile/AskMeetup";
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
      _count: { select: { posts: true } },
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

  // Accepted-only counts (pending requests don't inflate them) plus the
  // viewer's own row for the Follow/Requested/Following button state.
  // Posts and grid stay public — no read-path gating for private accounts.
  const viewerId = session?.user?.id ?? null;
  const [followers, following, myRow] = await Promise.all([
    db.follow.count({ where: { followingId: user.id, status: "accepted" } }),
    db.follow.count({ where: { followerId: user.id, status: "accepted" } }),
    viewerId
      ? db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: user.id,
            },
          },
          select: { status: true },
        })
      : Promise.resolve(null),
  ]);
  const initialFollow =
    myRow?.status === "accepted"
      ? ("accepted" as const)
      : myRow?.status === "pending"
        ? ("pending" as const)
        : ("none" as const);

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
      followers,
      following,
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
      <ProfileHeader
        profile={profile}
        isOwn={false}
        initialFollow={initialFollow}
        isPrivate={user.isPrivate}
      />

      <AskMeetup handle={handle} />

      <PostGrid items={profile.grid} />
    </div>
  );
}
