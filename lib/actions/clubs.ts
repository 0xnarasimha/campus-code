"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const DB_UNREACHABLE_MESSAGE =
  "Database not reachable. Set DATABASE_URL (see README) and try again.";

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

export type RegisterClubResult =
  | { ok: true; club: { id: string; name: string } }
  | Failure;

export async function registerClubCore(
  userId: string,
  input: { name: string; description?: string }
): Promise<RegisterClubResult> {
  try {
    const name = input.name.trim();
    if (name.length < 3 || name.length > 60) {
      return { ok: false, error: "Club name must be 3–60 characters." };
    }
    const description = (input.description ?? "").trim().slice(0, 500);
    const club = await db.club.create({
      data: { name, description, ownerId: userId },
      select: { id: true, name: true },
    });
    return { ok: true, club };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, error: "A club with that name already exists." };
    }
    return dbError(err, "registerClub");
  }
}

export async function registerClub(input: {
  name: string;
  description?: string;
}): Promise<RegisterClubResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  return registerClubCore(userId, input);
}

export type CreateEventResult =
  | { ok: true; event: { id: string; title: string; date: Date } }
  | Failure;

export async function createEventCore(
  userId: string,
  input: { clubId: string; title: string; dateISO: string; venue?: string }
): Promise<CreateEventResult> {
  try {
    const title = input.title.trim();
    if (title.length < 3 || title.length > 120) {
      return { ok: false, error: "Event title must be 3–120 characters." };
    }
    const date = new Date(input.dateISO);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, error: "Invalid event date." };
    }
    if (date <= new Date()) {
      return { ok: false, error: "Event date must be in the future." };
    }
    const club = await db.club.findUnique({
      where: { id: input.clubId },
      select: { id: true, ownerId: true },
    });
    if (!club) return { ok: false, error: "Club not found" };
    if (club.ownerId !== userId) {
      return { ok: false, error: "Only the club owner can create events." };
    }
    const venue = (input.venue ?? "").trim().slice(0, 200);
    const event = await db.clubEvent.create({
      data: { clubId: input.clubId, title, date, venue },
      select: { id: true, title: true, date: true },
    });
    return { ok: true, event };
  } catch (err) {
    return dbError(err, "createEvent");
  }
}

export async function createEvent(input: {
  clubId: string;
  title: string;
  dateISO: string;
  venue?: string;
}): Promise<CreateEventResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  return createEventCore(userId, input);
}

export type ToggleRsvpResult =
  | { ok: true; rsvped: boolean; count: number }
  | Failure;

// Idempotent RSVP toggle via the Rsvp @@unique([eventId, userId])
// composite: second call with the same state flips it back.
export async function toggleRsvpCore(
  userId: string,
  eventId: string
): Promise<ToggleRsvpResult> {
  try {
    const event = await db.clubEvent.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) return { ok: false, error: "Event not found" };
    const existing = await db.rsvp.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    let rsvped: boolean;
    if (existing) {
      await db.rsvp.delete({
        where: { eventId_userId: { eventId, userId } },
      });
      rsvped = false;
    } else {
      await db.rsvp.create({ data: { eventId, userId } });
      rsvped = true;
    }
    const count = await db.rsvp.count({ where: { eventId } });
    return { ok: true, rsvped, count };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      try {
        const count = await db.rsvp.count({ where: { eventId } });
        return { ok: true, rsvped: true, count };
      } catch (inner) {
        return dbError(inner, "toggleRsvp");
      }
    }
    return dbError(err, "toggleRsvp");
  }
}

export async function toggleRsvp(
  eventId: string
): Promise<ToggleRsvpResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "You must be logged in" };
  return toggleRsvpCore(userId, eventId);
}

export type ClubCard = {
  id: string;
  name: string;
  description: string;
  ownerHandle: string;
  eventCount: number;
  memberCount: number;
};

// memberCount = distinct RSVP users across club events + owner (honest
// no-membership-table approximation, per brief).
export async function getClubs(): Promise<ClubCard[]> {
  try {
    const clubs = await db.club.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        owner: { select: { handle: true } },
        events: {
          select: { id: true, rsvps: { select: { userId: true } } },
        },
      },
    });
    return clubs.map((c) => {
      const members = new Set<string>();
      for (const e of c.events) {
        for (const r of e.rsvps) members.add(r.userId);
      }
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        ownerHandle: c.owner.handle,
        eventCount: c.events.length,
        memberCount: members.size + 1, // + owner
      };
    });
  } catch (err) {
    console.error("getClubs failed:", err);
    return [];
  }
}

export type UpcomingEvent = {
  id: string;
  title: string;
  date: Date;
  venue: string;
  clubName: string;
  rsvpCount: number;
  myRsvp: boolean;
};

export async function getUpcomingEventsCore(
  userId: string | null
): Promise<UpcomingEvent[]> {
  try {
    const events = await db.clubEvent.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        date: true,
        venue: true,
        club: { select: { name: true } },
        rsvps: { select: { userId: true } },
      },
    });
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      venue: e.venue,
      clubName: e.club.name,
      rsvpCount: e.rsvps.length,
      myRsvp: userId ? e.rsvps.some((r) => r.userId === userId) : false,
    }));
  } catch (err) {
    console.error("getUpcomingEvents failed:", err);
    return [];
  }
}

export async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  return getUpcomingEventsCore(await currentUserId());
}
