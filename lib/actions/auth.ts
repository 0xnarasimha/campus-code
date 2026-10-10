"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/lib/db";

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;

type ActionResult = { ok: true } | { ok: false; error: string };

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
    return { ok: true };
  } catch {
    return { ok: false, error: "Handle or email already taken" };
  }
}

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      redirect: false,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Invalid credentials" };
    }
    throw err;
  }
}
