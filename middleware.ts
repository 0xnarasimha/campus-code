import { jwtVerify } from "jose";
import { auth } from "./auth.config";

// Admin session: Edge-safe HS256 check of the cc_admin cookie. This module
// cannot import lib/admin-auth.ts (server-only: bcrypt + next/headers at
// module scope), so the few-line verify is intentionally duplicated here —
// same split as auth.config.ts (edge) vs auth.ts (server). Cookie name and
// issuer must stay in sync with lib/admin-auth.ts; the signing key is the
// existing AUTH_SECRET (documented reuse, no second secret).
const ADMIN_COOKIE = "cc_admin";
const ADMIN_JWT_ISSUER = "campus-code-admin";

async function isValidAdminCookie(token: string | undefined): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { issuer: ADMIN_JWT_ISSUER },
    );
    return payload.admin === true;
  } catch {
    return false;
  }
}

function isAdminLogin(pathname: string): boolean {
  return pathname === "/admin/login";
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

const PROTECTED_PREFIXES = [
  "/study",
  "/leaderboard",
  "/messages",
  "/profile",
] as const;

const AUTH_ROUTES = ["/login", "/signup"] as const;

function isProtected(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return (AUTH_ROUTES as readonly string[]).includes(pathname);
}

export default auth(async (req) => {
  const { pathname, search } = req.nextUrl;

  // Admin area guard (separate from user auth): /admin/* except
  // /admin/login requires a valid admin cookie; an authed admin visiting
  // the login page is sent to /admin.
  if (isAdminRoute(pathname)) {
    const adminOk = await isValidAdminCookie(
      req.cookies.get(ADMIN_COOKIE)?.value,
    );
    if (isAdminLogin(pathname)) {
      if (adminOk) return Response.redirect(new URL("/admin", req.url));
      return undefined;
    }
    if (!adminOk) {
      return Response.redirect(new URL("/admin/login", req.url));
    }
    return undefined;
  }

  const loggedIn = !!req.auth;

  if (!loggedIn && isProtected(pathname)) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  if (loggedIn && isAuthRoute(pathname)) {
    return Response.redirect(new URL("/", req.url));
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
