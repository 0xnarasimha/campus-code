"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signupAction } from "@/lib/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await signupAction({ handle, name, email, password });
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
      <h1 className="text-2xl font-bold text-ig-text dark:text-white">
        Join DevDb MBU
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
          {pending ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
