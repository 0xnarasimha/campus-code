"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { adminLoginAction } from "@/lib/actions/admin";

// Admin login — deliberately NOT the app shell: a simple centered card.
function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await adminLoginAction({ email, password });
      if (result.ok) {
        router.push("/admin");
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
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg px-4 py-10">
      <main className="w-full max-w-md border border-ig-border bg-surface p-8">
        <h1 className="text-center text-2xl font-bold text-ig-text">
          Admin login
        </h1>
        <p className="mt-1 text-center text-sm text-ig-secondary">
          Restricted area. This login is separate from user accounts.
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3.5">
          <label className="sr-only" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 rounded border border-ig-border bg-bg px-4 text-lg text-ig-text outline-none placeholder:text-ig-secondary focus:border-ig-blue"
          />
          <label className="sr-only" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Admin password"
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
            {pending ? "Logging in…" : "Log in as admin"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
