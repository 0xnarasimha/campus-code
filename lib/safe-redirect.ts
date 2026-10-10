// Same-origin guard for callbackUrl: only absolute paths on this host.
// Rejects "//evil.com", "https://…", and non-strings. Defaults to "/".
export function safeRedirectTo(url: unknown): string {
  if (typeof url !== "string") return "/";
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}
