"use server";

// Client-importable barrel for the admin Server Actions. The logic lives in
// lib/admin-auth.ts (single source of truth), but that module also exports
// ADMIN_COOKIE and imports next/headers at top level, so client components
// cannot import it directly — hence these explicit wrappers, mirroring the
// repo's lib/actions/auth.ts pattern.
import {
  adminLoginAction as loginImpl,
  adminLogoutAction as logoutImpl,
} from "@/lib/admin-auth";

export async function adminLoginAction(input: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return loginImpl(input);
}

export async function adminLogoutAction(): Promise<void> {
  return logoutImpl();
}
