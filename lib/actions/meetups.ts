"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createMeetupRequest,
  respondToMeetup,
} from "@/lib/meetups";

type Failure = { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

function fail(err: unknown): Failure {
  const msg = err instanceof Error ? err.message : "Something went wrong, try again";
  // Friendly domain errors from lib/meetups.ts pass through as-is; anything
  // else is logged and masked.
  if (
    msg.includes("yourself") ||
    msg.includes("Place must") ||
    msg.includes("Note must") ||
    msg.includes("not found") ||
    msg.includes("Only the recipient") ||
    msg.includes("already ")
  ) {
    return { ok: false, error: msg };
  }
  console.error("meetups action failed:", err);
  return { ok: false, error: "Something went wrong, try again" };
}

export type RequestMeetupResult =
  | { ok: true; id: string; conversationId: string }
  | Failure;

// Creates the MeetupRequest row AND posts the DM message into the 1:1
// thread (find-or-create), so the recipient sees it in Messages.
export async function requestMeetup(input: {
  handle: string;
  place: string;
  note?: string;
}): Promise<RequestMeetupResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  try {
    const target = await db.user.findUnique({
      where: { handle: input.handle },
      select: { id: true },
    });
    if (!target) return { ok: false, error: "User not found" };
    const { request, conversationId } = await createMeetupRequest({
      requesterId: userId,
      recipientId: target.id,
      place: input.place,
      note: input.note,
    });
    return { ok: true, id: request.id, conversationId };
  } catch (err) {
    return fail(err);
  }
}

export type RespondMeetupResult =
  | { ok: true; status: string; conversationId: string }
  | Failure;

// Recipient-only. On accept posts the "Meetup accepted: <place>" system
// message into the requester's DM thread and returns the thread id.
export async function respondMeetup(input: {
  id: string;
  accept: boolean;
}): Promise<RespondMeetupResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  try {
    const { request, conversationId } = await respondToMeetup({
      requestId: input.id,
      responderId: userId,
      accept: input.accept,
    });
    return { ok: true, status: request.status, conversationId };
  } catch (err) {
    return fail(err);
  }
}

export type MeetupDTO = {
  id: string;
  place: string;
  note: string;
  status: string;
  createdAt: Date;
  requesterHandle: string;
  requesterName: string;
  recipientHandle: string;
  recipientName: string;
  canRespond: boolean;
};

export async function getMeetup(
  id: string
): Promise<{ ok: true; meetup: MeetupDTO } | Failure> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  const m = await db.meetupRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { handle: true, name: true } },
      recipient: { select: { handle: true, name: true } },
    },
  });
  if (!m) return { ok: false, error: "Meetup request not found" };
  if (m.requesterId !== userId && m.recipientId !== userId) {
    return { ok: false, error: "Not your conversation" };
  }
  return {
    ok: true,
    meetup: {
      id: m.id,
      place: m.place,
      note: m.note,
      status: m.status,
      createdAt: m.createdAt,
      requesterHandle: m.requester.handle,
      requesterName: m.requester.name,
      recipientHandle: m.recipient.handle,
      recipientName: m.recipient.name,
      canRespond: m.recipientId === userId && m.status === "pending",
    },
  };
}

export type InboxMeetupDTO = MeetupDTO & {
  direction: "incoming" | "outgoing";
  otherHandle: string;
  otherName: string;
};

// All requests involving the viewer, newest first. The mock-driven Messages
// page merges these into threads by otherHandle (see messages/page.tsx).
export async function getMyMeetups(): Promise<
  { ok: true; me: string; meetups: InboxMeetupDTO[] } | Failure
> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  const session = await auth();
  const rows = await db.meetupRequest.findMany({
    where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      requester: { select: { handle: true, name: true } },
      recipient: { select: { handle: true, name: true } },
    },
  });
  return {
    ok: true,
    me: session?.user?.handle ?? "",
    meetups: rows.map((m) => {
      const incoming = m.recipientId === userId;
      const other = incoming ? m.requester : m.recipient;
      return {
        id: m.id,
        place: m.place,
        note: m.note,
        status: m.status,
        createdAt: m.createdAt,
        requesterHandle: m.requester.handle,
        requesterName: m.requester.name,
        recipientHandle: m.recipient.handle,
        recipientName: m.recipient.name,
        canRespond: incoming && m.status === "pending",
        direction: incoming ? ("incoming" as const) : ("outgoing" as const),
        otherHandle: other.handle,
        otherName: other.name,
      };
    }),
  };
}
