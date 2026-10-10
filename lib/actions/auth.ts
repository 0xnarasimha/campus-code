"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { safeRedirectTo } from "@/lib/safe-redirect";

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;

type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string };

function initialsFor(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "U";
}

export async function signupAction(input: {
  handle: string;
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}): Promise<ActionResult> {
  const handle = input.handle.trim();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!HANDLE_RE.test(handle)) {
    return {
      ok: false,
      error: "Handle must be 3-20 characters: letters, numbers, underscores.",
    };
  }
  if (name.length < 1 || name.length > 50) {
    return { ok: false, error: "Name must be 1-50 characters." };
  }
  if (
    typeof input.confirmPassword === "string" &&
    password !== input.confirmPassword
  ) {
    return { ok: false, error: "Passwords do not match" };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ handle }, { email }] },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Handle or email already taken" };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.create({
      data: {
        handle,
        name,
        email,
        passwordHash,
        year: "",
        branch: "",
        avatarInitials: initialsFor(name),
      },
    });
  } catch (err) {
    // Race lost (or other constraint hit): friendly message only for P2002.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, error: "Handle or email already taken" };
    }
    console.error("signupAction failed:", err);
    return { ok: false, error: "Something went wrong, try again" };
  }

  // Auto-sign-in (spec §5): land on `/` authenticated so middleware's
  // auth-route guard doesn't bounce the new user back to /login. If the
  // sign-in itself fails, the account still exists — return ok and let the
  // client fall back to a manual login.
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    console.error("signupAction auto sign-in failed:", err);
  }
  return { ok: true };
}

export async function loginAction(input: {
  email: string;
  password: string;
  callbackUrl?: unknown;
}): Promise<ActionResult> {
  const redirectTo = safeRedirectTo(input.callbackUrl);
  try {
    await signIn("credentials", {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      redirect: false,
      redirectTo,
    });
    return { ok: true, redirectTo };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Invalid credentials" };
    }
    throw err;
  }
}
