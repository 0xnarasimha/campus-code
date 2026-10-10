import { db } from "@/lib/db";
import { scorePost } from "@/lib/feed-algo";

export interface FeedComment {
  user: string;
  text: string;
}

export interface FeedPost {
  id: string;
  author: string;
  authorInitials: string;
  verified: boolean;
  time: string;
  createdAt: Date;
  location: string;
  topic: string;
  desc: string;
  tags: string[];
  likes: number;
  liked: boolean;
  likedBy: string[];
  comments: FeedComment[];
  commentCount: number;
  shares: number;
  authorFollowed: boolean;
  score: number;
  code?: { file: string; lang: string; snippet: string };
}

function timeAgo(createdAt: Date, now: Date): string {
  const mins = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 60_000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// Ranked feed: Prisma query (posts + author + counts + liked-by-me +
// followed authors), score attached via lib/feed-algo, sorted desc.
// Pass userId when logged in for liked/followed personalization; omit for
// anonymous (all liked=false, authorFollowed=false).
export async function getFeed(userId?: string): Promise<FeedPost[]> {
  const now = new Date();
  const [posts, followedIds] = await Promise.all([
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { handle: true, avatarInitials: true, verified: true },
        },
        _count: { select: { likes: true, comments: true } },
        likes: {
          take: 3,
          orderBy: { postId: "asc" },
          include: { user: { select: { handle: true } } },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          take: 10,
          include: { author: { select: { handle: true } } },
        },
      },
    }),
    userId
      ? db.follow
          .findMany({
            where: { followerId: userId },
            select: { followingId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.followingId)))
      : Promise.resolve(new Set<string>()),
  ]);

  const myLikes = userId
    ? new Set(
        (
          await db.like.findMany({
            where: {
              userId,
              postId: { in: posts.map((p) => p.id) },
            },
            select: { postId: true },
          })
        ).map((l) => l.postId)
      )
    : new Set<string>();

  const feed: FeedPost[] = posts.map((p) => {
    const authorFollowed = followedIds.has(p.authorId);
    const score = scorePost({
      likeCount: p._count.likes,
      commentCount: p._count.comments,
      shareCount: p.shares,
      createdAt: p.createdAt,
      authorFollowed,
      now,
    });
    return {
      id: p.id,
      author: p.author.handle,
      authorInitials: p.author.avatarInitials,
      verified: p.author.verified,
      time: timeAgo(p.createdAt, now),
      createdAt: p.createdAt,
      location: p.location,
      topic: p.topic,
      desc: p.body,
      tags: p.tags,
      likes: p._count.likes,
      liked: myLikes.has(p.id),
      likedBy: p.likes.map((l) => l.user.handle),
      comments: p.comments.map((c) => ({
        user: c.author.handle,
        text: c.body,
      })),
      commentCount: p._count.comments,
      shares: p.shares,
      authorFollowed,
      score,
      code:
        p.codeFile && p.codeSnippet
          ? {
              file: p.codeFile,
              lang: p.codeLang ?? "",
              snippet: p.codeSnippet,
            }
          : undefined,
    };
  });

  feed.sort((a, b) => b.score - a.score);
  return feed;
}
