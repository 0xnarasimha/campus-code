"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { validateSpotInput } from "@/lib/spot-validation";

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

function dbError(err: unknown, label: string): Failure {
  if (isDbUnreachable(err)) return { ok: false, error: DB_UNREACHABLE_MESSAGE };
  console.error(`${label} failed:`, err);
  return { ok: false, error: "Something went wrong, try again" };
}

export interface CreatedSpot {
  id: string;
  name: string;
  building: string;
  capacity: number;
  occupancy: number;
  quietness: number;
  openSeats: number;
  amenities: string[];
}

export interface CreateSpotInput {
  name: string;
  building: string;
  capacity: number;
  quietness: number;
  amenities: string[];
}

export type CreateSpotResult = { ok: true; spot: CreatedSpot } | Failure;

export async function createSpot(
  input: CreateSpotInput
): Promise<CreateSpotResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "You must be logged in" };

  const validated = validateSpotInput(input);
  if (!validated.ok) return validated;
  const { name, building, capacity, quietness, amenities } = validated.data;

  try {
    const spot = await db.studySpot.create({
      data: {
        name,
        building,
        capacity,
        occupancy: 0,
        quietness,
        openSeats: capacity,
        amenities,
        createdById: userId,
      },
    });
    return {
      ok: true,
      spot: {
        id: spot.id,
        name: spot.name,
        building: spot.building,
        capacity: spot.capacity,
        occupancy: spot.occupancy,
        quietness: spot.quietness,
        openSeats: spot.openSeats,
        amenities: spot.amenities,
      },
    };
  } catch (err) {
    return dbError(err, "createSpot");
  }
}
