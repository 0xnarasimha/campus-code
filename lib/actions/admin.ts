"use server";

// Client-importable barrel for the admin Server Actions. The logic lives in
// lib/admin-auth.ts (single source of truth), but that module also exports
// ADMIN_COOKIE and imports next/headers at top level, so client components
// cannot import it directly — hence these explicit wrappers, mirroring the
// repo's lib/actions/auth.ts pattern.
import { revalidatePath } from "next/cache";
import {
  adminLoginAction as loginImpl,
  adminLogoutAction as logoutImpl,
  verifyAdminRequest,
} from "@/lib/admin-auth";
import { deleteAdminRow, isAdminTable } from "@/lib/admin-data";

export async function adminLoginAction(input: {
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return loginImpl(input);
}

export async function adminLogoutAction(): Promise<void> {
  return logoutImpl();
}

export async function adminDelete(input: {
  table: string;
  id: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  // Never trust the client: re-verify the admin session on every call.
  // verifyAdminRequest reads the cookie server-side; outside a request scope
  // (or without a valid session) it throws/returns false → fail closed.
  let authed = false;
  try {
    authed = await verifyAdminRequest();
  } catch {
    authed = false;
  }
  if (!authed) {
    return { ok: false, error: "Unauthorized" };
  }
  if (!isAdminTable(input.table)) {
    return { ok: false, error: "Unknown table" };
  }
  try {
    await deleteAdminRow(input.table, input.id);
  } catch {
    return { ok: false, error: "Delete failed" };
  }
  revalidatePath("/admin");
  return { ok: true };
}
