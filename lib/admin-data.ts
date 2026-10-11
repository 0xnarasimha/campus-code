import { db } from "@/lib/db";

// Server-only data layer for the admin panel. Imported by app/admin/page.tsx
// (a Server Component behind the middleware admin guard) and by throwaway
// probe scripts. It performs NO auth check itself — every entry point must
// verify the admin session first (see adminDelete in lib/actions/admin.ts,
// and the middleware + redirect guard on the page).

export const ADMIN_TABLES = [
  "user",
  "post",
  "comment",
  "club",
  "clubEvent",
  "studySpot",
  "meetupRequest",
  "rsvp",
] as const;

export type AdminTable = (typeof ADMIN_TABLES)[number];

export function isAdminTable(table: unknown): table is AdminTable {
  return (
    typeof table === "string" &&
    (ADMIN_TABLES as readonly string[]).includes(table)
  );
}

// RSVP rows have no scalar id (@@unique([eventId, userId])), so the panel
// addresses them as "eventId:userId" (cuids never contain ":").
export function encodeRsvpId(eventId: string, userId: string): string {
  return `${eventId}:${userId}`;
}

function decodeRsvpId(id: string): { eventId: string; userId: string } | null {
  const sep = id.indexOf(":");
  if (sep <= 0 || sep === id.length - 1) return null;
  return { eventId: id.slice(0, sep), userId: id.slice(sep + 1) };
}

export async function getAdminStats(): Promise<Record<string, number>> {
  const [
    users,
    posts,
    comments,
    clubs,
    events,
    spots,
    meetups,
    follows,
    rsvps,
  ] = await db.$transaction([
    db.user.count(),
    db.post.count(),
    db.comment.count(),
    db.club.count(),
    db.clubEvent.count(),
    db.studySpot.count(),
    db.meetupRequest.count(),
    db.follow.count(),
    db.rsvp.count(),
  ]);
  return {
    users,
    posts,
    comments,
    clubs,
    events,
    spots,
    meetups,
    follows,
    rsvps,
  };
}

export type AdminRow = { id: string; label: string; sub: string };

const LATEST_TAKE = 10;

export async function getAdminLatest(): Promise<Record<AdminTable, AdminRow[]>> {
  const [
    users,
    posts,
    comments,
    clubs,
    events,
    spots,
    meetups,
    rsvps,
  ] = await db.$transaction([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: LATEST_TAKE,
      select: { id: true, handle: true, name: true, createdAt: true },
    }),
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: LATEST_TAKE,
      select: { id: true, topic: true, authorId: true, createdAt: true },
    }),
    db.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: LATEST_TAKE,
      select: { id: true, body: true, authorId: true, createdAt: true },
    }),
    db.club.findMany({
      orderBy: { createdAt: "desc" },
      take: LATEST_TAKE,
      select: { id: true, name: true, createdAt: true },
    }),
    db.clubEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: LATEST_TAKE,
      select: { id: true, title: true, date: true },
    }),
    db.studySpot.findMany({
      orderBy: { name: "asc" },
      take: LATEST_TAKE,
      select: { id: true, name: true, building: true },
    }),
    db.meetupRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: LATEST_TAKE,
      select: { id: true, place: true, status: true, createdAt: true },
    }),
    db.rsvp.findMany({
      orderBy: { createdAt: "desc" },
      take: LATEST_TAKE,
      select: {
        eventId: true,
        userId: true,
        createdAt: true,
        event: { select: { title: true } },
        user: { select: { handle: true } },
      },
    }),
  ]);

  return {
    user: users.map((u) => ({
      id: u.id,
      label: `@${u.handle} (${u.name})`,
      sub: u.createdAt.toISOString(),
    })),
    post: posts.map((p) => ({
      id: p.id,
      label: p.topic,
      sub: p.createdAt.toISOString(),
    })),
    comment: comments.map((c) => ({
      id: c.id,
      label:
        c.body.length > 80 ? `${c.body.slice(0, 80)}…` : c.body,
      sub: c.createdAt.toISOString(),
    })),
    club: clubs.map((c) => ({
      id: c.id,
      label: c.name,
      sub: c.createdAt.toISOString(),
    })),
    clubEvent: events.map((e) => ({
      id: e.id,
      label: e.title,
      sub: e.date.toISOString(),
    })),
    studySpot: spots.map((s) => ({
      id: s.id,
      label: s.name,
      sub: s.building,
    })),
    meetupRequest: meetups.map((m) => ({
      id: m.id,
      label: `${m.place} [${m.status}]`,
      sub: m.createdAt.toISOString(),
    })),
    rsvp: rsvps.map((r) => ({
      id: encodeRsvpId(r.eventId, r.userId),
      label: `@${r.user.handle} → ${r.event.title}`,
      sub: r.createdAt.toISOString(),
    })),
  };
}

// Pure-DB row deletion (no auth check — callers must verify the admin
// session). Throws on unknown table / bad id / missing row (P2025).
export async function deleteAdminRow(
  table: AdminTable,
  id: string,
): Promise<void> {
  if (!id) throw new Error("Missing id");
  switch (table) {
    case "post":
      await db.post.delete({ where: { id } });
      return;
    case "comment":
      await db.comment.delete({ where: { id } });
      return;
    case "club":
      // Club events + their RSVPs cascade via onDelete: Cascade.
      await db.club.delete({ where: { id } });
      return;
    case "clubEvent":
      // RSVPs cascade via onDelete: Cascade.
      await db.clubEvent.delete({ where: { id } });
      return;
    case "studySpot":
      await db.studySpot.delete({ where: { id } });
      return;
    case "meetupRequest":
      // Linked chat messages keep history with meetupRequestId set null.
      await db.meetupRequest.delete({ where: { id } });
      return;
    case "rsvp": {
      const key = decodeRsvpId(id);
      if (!key) throw new Error("Bad RSVP id");
      await db.rsvp.delete({
        where: { eventId_userId: { eventId: key.eventId, userId: key.userId } },
      });
      return;
    }
    case "user":
      await deleteUserCascade(id);
      return;
  }
}

// User has several relations WITHOUT onDelete cascade in the schema
// (Post.author, Message.sender, StudySpot.createdBy, Club.owner, plus the
// Conversation m-n join), so dependents must be removed explicitly.
// Everything else (accounts, sessions, likes, comments, follows, meetups,
// rsvps) cascades via onDelete: Cascade on delete of the user row.
async function deleteUserCascade(userId: string): Promise<void> {
  const conversations = await db.conversation.findMany({
    where: { participants: { some: { id: userId } } },
    select: { id: true },
  });
  await db.$transaction([
    // Chat messages sent by the user (Message.sender has no cascade).
    db.message.deleteMany({ where: { senderId: userId } }),
    // Spots created by the user become unowned (optional relation).
    db.studySpot.updateMany({
      where: { createdById: userId },
      data: { createdById: null },
    }),
    // Posts authored by the user (their likes + comments cascade).
    db.post.deleteMany({ where: { authorId: userId } }),
    // Clubs owned by the user (their events + RSVPs cascade).
    db.club.deleteMany({ where: { ownerId: userId } }),
    // Leave conversations (m-n join, no cascade possible).
    ...conversations.map((c) =>
      db.conversation.update({
        where: { id: c.id },
        data: { participants: { disconnect: { id: userId } } },
      }),
    ),
    // Finally the user row (accounts, sessions, likes, comments, follows,
    // meetups, rsvps cascade).
    db.user.delete({ where: { id: userId } }),
  ]);
}
