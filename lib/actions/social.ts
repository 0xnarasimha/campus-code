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
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "You must be logged in" };
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
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "You must be logged in" };
    const text = body.trim();
    if (text.length < 1 || text.length > 500) {
      return { ok: false, error: "Comment must be 1–500 characters." };
    }
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

export type FollowState = "none" | "pending" | "accepted";

export type ToggleFollowResult =
  | {
      ok: true;
      following: boolean;
      requested: boolean;
      followers: number;
    }
  | Failure;

// Private-by-default follow: tapping Follow on a private account creates a
// pending request (second tap cancels it); public accounts follow at once.
// `following` means an accepted follow; `requested` means pending.
// `followers` counts accepted follows only. Core takes an explicit userId
// so probes can exercise it without a session (same pattern as
// updateProfileCore); the exported wrapper resolves the session.
export async function toggleFollowCore(
  userId: string,
  handle: string
): Promise<ToggleFollowResult> {
  try {
    const target = await db.user.findUnique({
      where: { handle },
      select: { id: true, isPrivate: true },
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
    let requested: boolean;
    if (existing) {
      // Accepted or pending alike: tap again removes it (unfollow / cancel
      // request). The composite unique keeps this idempotent.
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: target.id,
          },
        },
      });
      following = false;
      requested = false;
    } else if (target.isPrivate) {
      await db.follow.create({
        data: { followerId: userId, followingId: target.id, status: "pending" },
      });
      following = false;
      requested = true;
    } else {
      await db.follow.create({
        data: { followerId: userId, followingId: target.id, status: "accepted" },
      });
      following = true;
      requested = false;
    }
    const followers = await db.follow.count({
      where: { followingId: target.id, status: "accepted" },
    });
    return { ok: true, following, requested, followers };
  } catch (err) {
    return dbError(err, "toggleFollow");
  }
}

export async function toggleFollow(
  handle: string
): Promise<ToggleFollowResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  return toggleFollowCore(userId, handle);
}

export type RespondFollowResult =
  | { ok: true; accepted: boolean; followers: number }
  | Failure;

// Recipient-only: accept (row → accepted) or decline (row deleted) an
// incoming pending request identified by the requester's handle.
export async function respondFollowCore(
  userId: string,
  requesterHandle: string,
  accept: boolean
): Promise<RespondFollowResult> {
  try {
    const requester = await db.user.findUnique({
      where: { handle: requesterHandle },
      select: { id: true },
    });
    if (!requester) return { ok: false, error: "User not found" };
    const pending = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: requester.id,
          followingId: userId,
        },
      },
    });
    if (!pending || pending.status !== "pending")
      return { ok: false, error: "Request not found" };
    if (accept) {
      await db.follow.update({
        where: {
          followerId_followingId: {
            followerId: requester.id,
            followingId: userId,
          },
        },
        data: { status: "accepted" },
      });
    } else {
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId: requester.id,
            followingId: userId,
          },
        },
      });
    }
    const followers = await db.follow.count({
      where: { followingId: userId, status: "accepted" },
    });
    return { ok: true, accepted: accept, followers };
  } catch (err) {
    return dbError(err, "respondFollow");
  }
}

export async function respondFollow({
  handle,
  accept,
}: {
  handle: string;
  accept: boolean;
}): Promise<RespondFollowResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  return respondFollowCore(userId, handle, accept);
}

export type FollowInfo = { state: FollowState; isPrivate: boolean };

// Batch lookup for follow buttons (leaderboard rows, feed cards): one query
// for privacy flags plus one for my rows with these handles. Anonymous
// callers get real isPrivate flags with state "none".
export async function getFollowInfo(
  handles: string[]
): Promise<Record<string, FollowInfo>> {
  const result: Record<string, FollowInfo> = {};
  const unique = [...new Set(handles.map((h) => h.trim()).filter(Boolean))].slice(
    0,
    50
  );
  if (unique.length === 0) return result;
  try {
    const userId = await currentUserId();
    const users = await db.user.findMany({
      where: { handle: { in: unique } },
      select: { id: true, handle: true, isPrivate: true },
    });
    for (const u of users) result[u.handle] = { state: "none", isPrivate: u.isPrivate };
    if (userId) {
      const rows = await db.follow.findMany({
        where: {
          followerId: userId,
          followingId: { in: users.map((u) => u.id) },
        },
        select: { followingId: true, status: true },
      });
      const stateById = new Map(rows.map((r) => [r.followingId, r.status]));
      for (const u of users) {
        const status = stateById.get(u.id);
        result[u.handle] = {
          state:
            status === "accepted"
              ? "accepted"
              : status === "pending"
                ? "pending"
                : "none",
          isPrivate: u.isPrivate,
        };
      }
    }
    return result;
  } catch (err) {
    console.error("getFollowInfo failed:", err);
    return result;
  }
}

export type BumpShareResult = { ok: true; shares: number } | Failure;

export async function bumpShare(postId: string): Promise<BumpShareResult> {
  try {
    const userId = await currentUserId();
    if (!userId) return { ok: false, error: "You must be logged in" };
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
