"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { loginAction } from "@/lib/actions/auth";
import { safeRedirectTo } from "@/lib/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Fail-soft gate: the Google provider only exists server-side when
  // GOOGLE_CLIENT_ID/SECRET are set, so ask the auth API rather than
  // reading env (unavailable in this client component).
  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: Record<string, unknown>) =>
        setGoogleEnabled(Boolean(p && p.google)),
      )
      .catch(() => setGoogleEnabled(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const callbackUrl = safeRedirectTo(searchParams.get("callbackUrl"));
      const result = await loginAction({ email, password, callbackUrl });
      if (result.ok) {
        router.push(result.redirectTo ?? callbackUrl);
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-bg px-4 py-10">
      <main className="w-full max-w-sm border border-ig-border bg-surface px-8 pb-6 pt-8">
        <div className="flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-ig-blue via-sky-500 to-violet-500 text-lg font-black text-white"
          >
            M
          </span>
          <span className="text-xl font-bold tracking-tight text-ig-text">
            DevDb MBU
          </span>
        </div>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-2.5">
          <label className="sr-only" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-ig-border bg-bg px-3 py-2.5 text-sm text-ig-text outline-none placeholder:text-ig-secondary focus:border-ig-blue"
          />
          <label className="sr-only" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-ig-border bg-bg px-3 py-2.5 text-sm text-ig-text outline-none placeholder:text-ig-secondary focus:border-ig-blue"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-1.5 rounded-lg bg-ig-blue px-3 py-2 text-sm font-semibold text-white transition-opacity hover:bg-ig-blue-hover disabled:opacity-60"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>
        {googleEnabled && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs font-semibold text-ig-secondary">
              <span className="h-px flex-1 bg-ig-border" />
              OR
              <span className="h-px flex-1 bg-ig-border" />
            </div>
            <button
              type="button"
              onClick={() =>
                signIn("google", {
                  redirectTo: safeRedirectTo(searchParams.get("callbackUrl")),
                })
              }
              className="flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-ig-blue"
            >
              <span
                aria-hidden="true"
                className="flex h-5 w-5 items-center justify-center rounded-full border border-ig-border text-xs font-black"
              >
                G
              </span>
              Log in with Google
            </button>
          </>
        )}
        <div className="mt-4 text-center">
          <a href="#" className="text-xs text-ig-secondary">
            Forgot password?
          </a>
        </div>
      </main>
      <div className="mt-3 w-full max-w-sm border border-ig-border bg-surface px-8 py-5 text-center text-sm text-ig-text">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-ig-blue">
          Sign up
        </Link>
      </div>
      <footer className="mt-6 text-center text-xs text-ig-secondary">
        About • Help • Privacy • © 2026 DevDb MBU
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
