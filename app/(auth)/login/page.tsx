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
    <div className="mx-auto flex min-h-[80vh] w-full max-w-sm flex-col justify-center px-4 py-8">
      <h1 className="text-2xl font-bold text-ig-text dark:text-white">
        Log in to DevDb MBU
      </h1>
      <p className="mt-1 text-sm text-ig-secondary">
        New here?{" "}
        <Link href="/signup" className="font-medium text-ig-blue">
          Create an account
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ig-text dark:text-white">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-ig-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-ig-blue dark:border-white/10"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ig-text dark:text-white">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-ig-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-ig-blue dark:border-white/10"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ig-blue px-3 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      {googleEnabled && (
        <>
          <div className="my-4 flex items-center gap-2 text-xs text-ig-secondary">
            <span className="h-px flex-1 bg-ig-border dark:bg-white/10" />
            or
            <span className="h-px flex-1 bg-ig-border dark:bg-white/10" />
          </div>
          <button
            type="button"
            onClick={() =>
              signIn("google", {
                redirectTo: safeRedirectTo(searchParams.get("callbackUrl")),
              })
            }
            className="rounded-lg border border-ig-border bg-surface px-3 py-2.5 text-sm font-semibold text-ig-text transition-opacity dark:border-white/10 dark:text-white"
          >
            Continue with Google
          </button>
        </>
      )}
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
