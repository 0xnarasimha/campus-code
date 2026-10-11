import { Prisma, type PrismaClient, type User } from "@prisma/client";

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

const MAX_CREATE_ATTEMPTS = 5;

function isHandleConflict(err: unknown): boolean {
  if (
    !(err instanceof Prisma.PrismaClientKnownRequestError) ||
    err.code !== "P2002"
  ) {
    return false;
  }
  const target = (err.meta as { target?: unknown } | undefined)?.target;
  const fields = Array.isArray(target) ? target.map(String) : [];
  // No target info (Prisma version variance): treat as a handle conflict and
  // retry; an email conflict surfaces via account-linking before createUser.
  return fields.length === 0 || fields.includes("handle");
}

/**
 * Race-safe OAuth user insert. findUnique-then-create has a TOCTOU window
 * (two concurrent Google signups, same slug): the loser hits P2002 on the
 * handle unique constraint. Regenerate the handle and retry (bounded); a
 * residual P2002 (or any other error) is rethrown — Auth.js maps adapter
 * failures to its generic error page, never a stack/500 leak.
 */
export async function createOAuthUser(
  db: Pick<PrismaClient, "user">,
  input: OAuthUserData,
): Promise<User> {
  const base = slugifyHandle(input.name, input.email);
  const name = input.name.trim() || input.email.split("@")[0];
  const email = input.email.trim().toLowerCase();
  const row = {
    name,
    email,
    // OAuth users have no password; empty hash can never verify via bcrypt.
    passwordHash: "",
    year: "",
    branch: "",
    avatarInitials: initialsFor(input.name, input.email),
    verified: input.emailVerified != null,
  };
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
    const handle = await generateUniqueHandle(db, base);
    try {
      return await (db.user as PrismaClient["user"]).create({
        data: { ...row, handle },
      });
    } catch (err) {
      if (!isHandleConflict(err)) throw err;
      lastErr = err;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Could not create OAuth user after retries");
}
