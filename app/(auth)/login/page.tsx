"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Flame, MapPin } from "lucide-react";
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
  const [googlePending, setGooglePending] = useState(false);
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
    <div className="flex min-h-dvh w-full bg-bg">
      {/* Art panel — desktop only */}
      <div
        aria-hidden="true"
        className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-ig-blue via-sky-600 to-violet-700 lg:flex"
      >
        <div className="relative h-[480px] w-[420px]">
          <div className="absolute left-4 top-8 w-60 -rotate-6 rounded-xl bg-white p-2 pb-6 shadow-2xl">
            <Image
              src="/login-art-1.jpg"
              alt=""
              width={400}
              height={267}
              className="h-44 w-full rounded-lg object-cover"
            />
          </div>
          <div className="absolute right-4 top-32 w-60 rotate-3 rounded-xl bg-white p-2 pb-6 shadow-2xl">
            <Image
              src="/login-art-2.jpg"
              alt=""
              width={400}
              height={267}
              className="h-44 w-full rounded-lg object-cover"
            />
          </div>
          <div className="absolute bottom-0 left-16 w-60 -rotate-2 rounded-xl bg-white p-2 pb-6 shadow-2xl">
            <Image
              src="/login-art-3.jpg"
              alt=""
              width={400}
              height={267}
              className="h-44 w-full rounded-lg object-cover"
            />
          </div>
          <div className="animate-login-float absolute left-0 top-2 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ig-text shadow-lg">
            <MapPin className="h-4 w-4 text-ig-blue" />
            Meet up
          </div>
          <div className="animate-login-float-delayed absolute bottom-10 right-0 flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-ig-text shadow-lg">
            <Flame className="h-4 w-4 text-orange-500" />
            Coding streak
          </div>
        </div>
      </div>

      {/* Auth column */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <main className="w-full max-w-md border border-ig-border bg-surface p-8">
          <h1 className="text-center font-script text-6xl leading-tight md:text-7xl">
            <span className="text-ig-text">Campus </span>
            <span className="text-ig-blue">Code</span>
          </h1>
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3.5">
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
              className="h-14 rounded border border-ig-border bg-bg px-4 text-lg text-ig-text outline-none placeholder:text-ig-secondary focus:border-ig-blue"
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
              className="h-14 rounded border border-ig-border bg-bg px-4 text-lg text-ig-text outline-none placeholder:text-ig-secondary focus:border-ig-blue"
            />
            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="mt-2 h-14 rounded-lg bg-ig-blue px-3 text-lg font-semibold text-white transition-opacity hover:bg-ig-blue-hover disabled:opacity-60"
            >
              {pending ? "Logging in…" : "Log in"}
            </button>
          </form>
          {googleEnabled && (
            <>
              <div className="my-5 flex items-center gap-3 text-sm font-semibold text-ig-secondary">
                <span className="h-px flex-1 bg-ig-border" />
                OR
                <span className="h-px flex-1 bg-ig-border" />
              </div>
              <button
                type="button"
                disabled={pending || googlePending}
                onClick={async () => {
                  setGooglePending(true);
                  try {
                    await signIn("google", {
                      redirectTo: safeRedirectTo(searchParams.get("callbackUrl")),
                    });
                  } catch {
                    setGooglePending(false);
                  }
                }}
                className="flex h-14 w-full items-center justify-center gap-2 px-3 text-base font-semibold text-ig-blue transition-opacity disabled:opacity-60"
              >
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-ig-border text-xs font-black"
                >
                  G
                </span>
                {googlePending ? "Redirecting to Google…" : "Log in with Google"}
              </button>
            </>
          )}
          <div className="mt-5 text-center">
            <a href="#" className="text-sm text-ig-secondary">
              Forgot password?
            </a>
          </div>
        </main>
        <div className="mt-4 w-full max-w-md border border-ig-border bg-surface px-8 py-6 text-center text-base text-ig-text">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-ig-blue">
            Sign up
          </Link>
        </div>
        <footer className="mt-8 text-center text-sm text-ig-secondary">
          About • Help • Privacy • © 2026 Campus Code
        </footer>
      </div>
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
