"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { signupAction } from "@/lib/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Fail-soft gate: see login page — the Google provider only exists when
  // GOOGLE_CLIENT_ID/SECRET are set server-side.
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

  const mismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await signupAction({
        handle,
        name,
        email,
        password,
        confirmPassword,
      });
      if (result.ok) {
        router.push("/");
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
      <h1 className="font-script text-4xl leading-tight">
        <span className="text-ig-text">Campus </span>
        <span className="text-ig-blue">Code</span>
      </h1>
      <p className="mt-1 text-sm text-ig-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ig-blue">
          Log in
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-ig-text dark:text-white">
          Handle
          <input
            type="text"
            required
            autoComplete="username"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="e.g. code_wizard"
            className="rounded-lg border border-ig-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-ig-blue dark:border-white/10"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ig-text dark:text-white">
          Name
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-ig-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-ig-blue dark:border-white/10"
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-ig-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-ig-blue dark:border-white/10"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ig-text dark:text-white">
          Confirm password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-lg border border-ig-border bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-ig-blue dark:border-white/10"
          />
        </label>
        {mismatch && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Passwords do not match
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || mismatch}
          className="rounded-lg bg-ig-blue px-3 py-2.5 text-sm font-semibold text-white transition-all duration-150 active:scale-95 disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Sign up"}
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
            disabled={pending || googlePending}
            onClick={async () => {
              setGooglePending(true);
              try {
                await signIn("google", { redirectTo: "/" });
              } catch {
                setGooglePending(false);
              }
            }}
            className="rounded-lg border border-ig-border bg-surface px-3 py-2.5 text-sm font-semibold text-ig-text transition-all duration-150 active:scale-95 disabled:opacity-60 dark:border-white/10 dark:text-white"
          >
            {googlePending ? "Redirecting to Google…" : "Continue with Google"}
          </button>
        </>
      )}
    </div>
  );
}
