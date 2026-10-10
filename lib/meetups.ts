// Meetup core: pure DB logic behind lib/actions/meetups.ts.
//
// The server actions wrap these with auth() + handle lookup so the live
// probe (tsx, no session) can exercise the exact same state transitions
// with explicit user ids. All rejection rules live here, not in the
// action layer, so probe results reflect production behavior.

import { db } from "@/lib/db";

export const MEETUP_PLACES = [
  "Central Library",
  "Terrace Cafe",
  "Innovation Hub",
] as const;

export function meetupMarker(id: string): string {
  return `[meetup:${id}]`;
}

export function parseMeetupMarker(body: string): string | null {
  const m = /\[meetup:([A-Za-z0-9_-]+)\]/.exec(body);
  return m ? (m[1] as string) : null;
}

// Exactly-two-participant 1:1 thread, found or created. Group threads that
// happen to contain both users are never reused (participants count === 2).
export async function findOrCreateDirectConversation(a: string, b: string) {
  const candidates = await db.conversation.findMany({
    where: {
      AND: [{ participants: { some: { id: a } } }, { participants: { some: { id: b } } }],
    },
    select: { id: true, participants: { select: { id: true } } },
  });
  const direct = candidates.find((c) => c.participants.length === 2);
  if (direct) return { id: direct.id, created: false as const };
  const created = await db.conversation.create({
    data: { participants: { connect: [{ id: a }, { id: b }] } },
    select: { id: true },
  });
  return { id: created.id, created: true as const };
}

export async function createMeetupRequest(opts: {
  requesterId: string;
  recipientId: string;
  place: string;
  note?: string;
}) {
  const place = opts.place.trim();
  const note = (opts.note ?? "").trim();
  if (opts.requesterId === opts.recipientId) {
    throw new Error("You can't request a meetup with yourself");
  }
  if (!place || place.length > 120) {
    throw new Error("Place must be 1–120 characters.");
  }
  if (note.length > 500) {
    throw new Error("Note must be under 500 characters.");
  }
  const request = await db.meetupRequest.create({
    data: {
      requesterId: opts.requesterId,
      recipientId: opts.recipientId,
      place,
      note,
    },
  });
  const thread = await findOrCreateDirectConversation(
    opts.requesterId,
    opts.recipientId
  );
  const message = await db.message.create({
    data: {
      conversationId: thread.id,
      senderId: opts.requesterId,
      body: `${meetupMarker(request.id)} Meetup request: ${place}${note ? ` — ${note}` : ""}`,
      meetupRequestId: request.id,
    },
  });
  return { request, conversationId: thread.id, messageId: message.id };
}

export async function respondToMeetup(opts: {
  requestId: string;
  responderId: string;
  accept: boolean;
}) {
  const request = await db.meetupRequest.findUnique({
    where: { id: opts.requestId },
  });
  if (!request) throw new Error("Meetup request not found");
  if (request.recipientId !== opts.responderId) {
    throw new Error("Only the recipient can respond to this request");
  }
  if (request.status !== "pending") {
    throw new Error(`Request already ${request.status}`);
  }
  const status = opts.accept ? "accepted" : "declined";
  const updated = await db.meetupRequest.update({
    where: { id: request.id },
    data: { status },
  });
  const thread = await findOrCreateDirectConversation(
    request.requesterId,
    request.recipientId
  );
  const message = await db.message.create({
    data: {
      conversationId: thread.id,
      senderId: opts.responderId,
      body: `Meetup ${status}: ${request.place}`,
      meetupRequestId: request.id,
    },
  });
  return { request: updated, conversationId: thread.id, messageId: message.id };
}
