"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { findOrCreateDirectConversation } from "@/lib/meetups";

const DB_UNREACHABLE_MESSAGE =
  "Database not reachable. Set DATABASE_URL (see README) and try again.";

// Same classification as lib/actions/social.ts (kept local: auth files are
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

export type CanMessageResult =
  | { ok: true; allowed: boolean; reason?: string }
  | Failure;

// Private-DM gate: a viewer may message the target when the target is
// public, OR an accepted follow exists in either direction, OR a 1:1 thread
// between the two already exists (so old threads keep working after an
// unfollow). Otherwise blocked with a friendly reason. Meetup
// request/accept/decline flows bypass this gate entirely (untouched).
// Core takes an explicit userId so probes can exercise it without a session
// (same pattern as social.ts); the exported wrapper resolves the session.
export async function canMessageCore(
  userId: string,
  targetHandle: string
): Promise<CanMessageResult> {
  try {
    const target = await db.user.findUnique({
      where: { handle: targetHandle },
      select: { id: true, handle: true, isPrivate: true },
    });
    if (!target) return { ok: false, error: "User not found" };
    if (target.id === userId) return { ok: true, allowed: true };
    if (!target.isPrivate) return { ok: true, allowed: true };
    const follow = await db.follow.findFirst({
      where: {
        status: "accepted",
        OR: [
          { followerId: userId, followingId: target.id },
          { followerId: target.id, followingId: userId },
        ],
      },
      select: { followerId: true },
    });
    if (follow) return { ok: true, allowed: true };
    // Read-only 1:1 check (never creates): same exactly-two-participants
    // rule as lib/meetups.ts findOrCreateDirectConversation.
    const candidates = await db.conversation.findMany({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: target.id } } },
        ],
      },
      select: { participants: { select: { id: true } } },
    });
    if (candidates.some((c) => c.participants.length === 2)) {
      return { ok: true, allowed: true };
    }
    return {
      ok: true,
      allowed: false,
      reason: `Follow @${target.handle} to message them`,
    };
  } catch (err) {
    return dbError(err, "canMessage");
  }
}

export async function canMessage(
  targetHandle: string
): Promise<CanMessageResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  return canMessageCore(userId, targetHandle);
}

export type StartThreadResult =
  | { ok: true; threadId: string; created: boolean }
  | Failure;

// Returns the existing 1:1 thread id or creates the Conversation. Blocked
// for private strangers (same gate as canMessage): no thread is created and
// the caller shows the friendly error instead.
export async function startThreadCore(
  userId: string,
  targetHandle: string
): Promise<StartThreadResult> {
  try {
    const target = await db.user.findUnique({
      where: { handle: targetHandle },
      select: { id: true, handle: true },
    });
    if (!target) return { ok: false, error: "User not found" };
    if (target.id === userId)
      return { ok: false, error: "You can't message yourself" };
    const gate = await canMessageCore(userId, target.handle);
    if (!gate.ok) return gate;
    if (!gate.allowed) {
      return {
        ok: false,
        error: gate.reason ?? `Follow @${target.handle} to message them`,
      };
    }
    const thread = await findOrCreateDirectConversation(userId, target.id);
    return { ok: true, threadId: thread.id, created: thread.created };
  } catch (err) {
    return dbError(err, "startThread");
  }
}

export async function startThread(
  targetHandle: string
): Promise<StartThreadResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  return startThreadCore(userId, targetHandle);
}
