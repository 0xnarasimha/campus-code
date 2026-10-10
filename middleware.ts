import { auth } from "./auth";

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

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
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
