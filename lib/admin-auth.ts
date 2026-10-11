import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Separate admin login: env credentials + jose-signed (HS256) cookie.
// The signing key is the existing AUTH_SECRET (documented reuse) — there is
// intentionally NO second secret. No User.role, no new tables.
//
// Edge note: this module is server-only (bcrypt + next/headers at module
// scope — never import it from middleware.ts, mirroring the
// auth.config.ts/auth.ts split). The middleware performs the same HS256
// check with its own Edge-safe jose verify; see middleware.ts.

export const ADMIN_COOKIE = "cc_admin";

const ADMIN_JWT_ISSUER = "campus-code-admin";
const ADMIN_SESSION_MAX_AGE_S = 12 * 60 * 60; // 12h

function getAuthSecret(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

function getAdminConfig(): {
  email: string;
  passwordHash: string;
} | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!email || !passwordHash) return null;
  return { email, passwordHash };
}

// Constant-time-ish email compare: compare SHA-256 digests with
// timingSafeEqual so early-exit string comparison never leaks prefix length.
function emailsMatch(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return ha.length === hb.length && timingSafeEqual(ha, hb);
}

// Edge-safe pure check (jose only — no cookies()/bcrypt). Shared by server
// callers; the middleware inlines the same logic because it cannot import
// this server-only module.
export async function verifyAdminToken(token: string): Promise<boolean> {
  const secret = getAuthSecret();
  if (!secret || !token) return false;
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ADMIN_JWT_ISSUER,
    });
    return payload.admin === true;
  } catch {
    // Expired, tampered, or wrong-secret tokens fail closed.
    return false;
  }
}

// Server-side request check: reads the cookie via next/headers and verifies
// the HS256 JWT. Use in Server Components / route handlers under /admin.
export async function verifyAdminRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

type AdminLoginResult = { ok: true } | { ok: false; error: string };

// Dummy bcrypt hash (valid format, unknown password) so an email mismatch
// still pays for one bcrypt.compare — uniform timing, no user enumeration.
const DUMMY_HASH =
  "$2b$12$R9xZ9Q9Q9Q9Q9Q9Q9Q9Q9udummyhashfortimingparity00000000000";

export async function adminLoginAction(input: {
  email: string;
  password: string;
}): Promise<AdminLoginResult> {
  "use server";
  const config = getAdminConfig();
  const secret = getAuthSecret();
  if (!config || !secret) {
    return { ok: false, error: "Admin login not configured" };
  }

  const email = input.email.trim().toLowerCase();
  const emailOk = emailsMatch(email, config.email);
  // Always compare (real hash on email hit, dummy otherwise) so wrong-email
  // and wrong-password take the same time and return the same message.
  const passwordOk = await bcrypt.compare(
    input.password,
    emailOk ? config.passwordHash : DUMMY_HASH,
  );
  if (!emailOk || !passwordOk) {
    return { ok: false, error: "Invalid credentials" };
  }

  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ADMIN_JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_S}s`)
    .sign(secret);

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Secure cookies only in production (plain http on localhost dev).
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_S,
  });
  return { ok: true };
}

export async function adminLogoutAction(): Promise<void> {
  "use server";
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
