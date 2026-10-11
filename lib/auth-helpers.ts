import type { PrismaClient } from "@prisma/client";

// Helpers for OAuth (Google) user creation. Extracted here so the logic is
// probeable from a temp script without touching NextAuth internals.

const MAX_HANDLE_LEN = 20;

/** Lowercase-alnum slug from a display name, underscores for separators. */
export function slugifyHandle(name: string, email: string): string {
  const fromName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, MAX_HANDLE_LEN)
    .replace(/_+$/g, "");
  if (fromName.length >= 3) return fromName;
  const prefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, MAX_HANDLE_LEN)
    .replace(/_+$/g, "");
  if (prefix.length >= 3) return prefix;
  return "user";
}

export function initialsFor(name: string, email: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  if (initials) return initials;
  const ch = email.trim()[0];
  return ch ? ch.toUpperCase() : "U";
}

/** Append digits on conflict until the handle is unique. */
export async function generateUniqueHandle(
  db: Pick<PrismaClient, "user">,
  base: string,
): Promise<string> {
  let candidate = base;
  for (let i = 1; i < 1000; i++) {
    const existing = await (db.user as PrismaClient["user"]).findUnique({
      where: { handle: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    const suffix = String(i);
    candidate = `${base.slice(0, MAX_HANDLE_LEN - suffix.length)}${suffix}`;
  }
  throw new Error("Could not generate a unique handle");
}

export interface OAuthUserData {
  name: string;
  email: string;
  emailVerified: Date | null;
}

/** Full User row data for an OAuth signup, satisfying all required fields. */
export async function buildOAuthUserData(
  db: Pick<PrismaClient, "user">,
  input: OAuthUserData,
): Promise<{
  handle: string;
  name: string;
  email: string;
  passwordHash: string;
  year: string;
  branch: string;
  avatarInitials: string;
  verified: boolean;
}> {
  const name = input.name.trim() || input.email.split("@")[0];
  const email = input.email.trim().toLowerCase();
  const handle = await generateUniqueHandle(
    db,
    slugifyHandle(input.name, input.email),
  );
  return {
    handle,
    name,
    email,
    // OAuth users have no password; empty hash can never verify via bcrypt.
    passwordHash: "",
    year: "",
    branch: "",
    avatarInitials: initialsFor(input.name, input.email),
    verified: input.emailVerified != null,
  };
}
