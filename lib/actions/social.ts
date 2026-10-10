"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const DB_UNREACHABLE_MESSAGE =
  "Database not reachable. Set DATABASE_URL (see README) and try again.";

// Same classification as lib/actions/auth.ts (kept local: auth files are
// off-limits for this batch). Prisma init/connection failures surface as
// PrismaClientInitializationError or P1000–P1017; message matching covers
// Prisma 7 driver-adapter variants.
function isDbUnreachable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    [
      "P1000",
      "P1001",
      "P1002",
      "P1003",
      "P1008",
      "P1009",
      "P1010",
      "P1017",
    ].includes(err.code)
  ) {
    return true;
  }
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : "";
  return (
    msg.includes("PrismaClientInitializationError") ||
    msg.includes("Can't reach database server") ||
    msg.includes("Environment variable not found: DATABASE_URL") ||
    msg.includes("invalid datasource") ||
    msg.includes("Connection closed") ||
    msg.includes("connect ECONNREFUSED") ||
    msg.includes("getaddrinfo ENOTFOUND")
  );
}

type Failure = { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

function dbError(err: unknown, label: string): Failure {
  if (isDbUnreachable(err)) return { ok: false, error: DB_UNREACHABLE_MESSAGE };
  console.error(`${label} failed:`, err);
  return { ok: false, error: "Something went wrong, try again" };
}

export type ToggleLikeResult =
  | { ok: true; liked: boolean; count: number }
  | Failure;

// Idempotent like/unlike via the Like @@unique([postId, userId]) composite:
// a second call with the same state flips it back, never double-counts.
export async function toggleLike(postId: string): Promise<ToggleLikeResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  try {
    const existing = await db.like.findUnique({
      where: { postId_userId: { postId, userId } },
    });
    let liked: boolean;
    if (existing) {
      await db.like.delete({
        where: { postId_userId: { postId, userId } },
      });
      liked = false;
    } else {
      await db.like.create({ data: { postId, userId } });
      liked = true;
    }
    const count = await db.like.count({ where: { postId } });
    return { ok: true, liked, count };
  } catch (err) {
    // Liking a missing post hits FK (P2003): friendly message, not a 500.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return { ok: false, error: "Post not found" };
    }
    // Lost race on create (P2002): treat as liked and recount.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      try {
        const count = await db.like.count({ where: { postId } });
        return { ok: true, liked: true, count };
      } catch (inner) {
        return dbError(inner, "toggleLike");
      }
    }
    return dbError(err, "toggleLike");
  }
}

export type AddCommentResult =
  | {
      ok: true;
      comment: { id: string; author: string; body: string; createdAt: Date };
    }
  | Failure;

export async function addComment(
  postId: string,
  body: string
): Promise<AddCommentResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  const text = body.trim();
  if (text.length < 1 || text.length > 500) {
    return { ok: false, error: "Comment must be 1–500 characters." };
  }
  try {
    const comment = await db.comment.create({
      data: { postId, authorId: userId, body: text },
      include: { author: { select: { handle: true } } },
    });
    return {
      ok: true,
      comment: {
        id: comment.id,
        author: comment.author.handle,
        body: comment.body,
        createdAt: comment.createdAt,
      },
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      return { ok: false, error: "Post not found" };
    }
    return dbError(err, "addComment");
  }
}

export type ToggleFollowResult =
  | { ok: true; following: boolean; followers: number }
  | Failure;

export async function toggleFollow(handle: string): Promise<ToggleFollowResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  try {
    const target = await db.user.findUnique({
      where: { handle },
      select: { id: true },
    });
    if (!target) return { ok: false, error: "User not found" };
    if (target.id === userId)
      return { ok: false, error: "You can't follow yourself" };
    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId: userId, followingId: target.id },
      },
    });
    let following: boolean;
    if (existing) {
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: target.id,
          },
        },
      });
      following = false;
    } else {
      await db.follow.create({
        data: { followerId: userId, followingId: target.id },
      });
      following = true;
    }
    const followers = await db.follow.count({
      where: { followingId: target.id },
    });
    return { ok: true, following, followers };
  } catch (err) {
    return dbError(err, "toggleFollow");
  }
}

export type BumpShareResult = { ok: true; shares: number } | Failure;

export async function bumpShare(postId: string): Promise<BumpShareResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  try {
    const post = await db.post.update({
      where: { id: postId },
      data: { shares: { increment: 1 } },
      select: { shares: true },
    });
    return { ok: true, shares: post.shares };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return { ok: false, error: "Post not found" };
    }
    return dbError(err, "bumpShare");
  }
}
