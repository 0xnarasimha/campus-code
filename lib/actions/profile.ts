"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  validateProfileInput,
  type ProfileInput,
} from "@/lib/profile-validation";

export type UpdateProfileResult =
  | {
      ok: true;
      user: {
        handle: string;
        name: string;
        bio: string;
        year: string;
        branch: string;
      };
    }
  | { ok: false; error: string };

// DB core without the session lookup, exported for verification probes:
// same validation, same update, same P2002 mapping as the action.
export async function updateProfileCore(
  userId: string,
  input: ProfileInput
): Promise<UpdateProfileResult> {
  const valid = validateProfileInput(input);
  if (!valid.ok) return valid;
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: valid.patch,
      select: { handle: true, name: true, bio: true, year: true, branch: true },
    });
    return { ok: true, user };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, error: "That handle is already taken." };
    }
    console.error("updateProfile failed:", err);
    return { ok: false, error: "Something went wrong, try again" };
  }
}

// Auth required. Login is email-based (Credentials authorize looks users
// up by email in auth.ts), so changing handle never breaks login — the
// JWT session id is stable; only session.user.handle goes stale until
// the next sign-in, which is cosmetic (own /profile loads by id).
export async function updateProfile(
  input: ProfileInput
): Promise<UpdateProfileResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "You must be logged in" };
  return updateProfileCore(userId, input);
}
