"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/profile";
import {
  HANDLE_RE,
  MAX_BIO,
  MAX_BRANCH,
  MAX_NAME,
  MAX_YEAR,
} from "@/lib/profile-validation";
import { Button } from "@/components/ui/button";

export interface EditProfileInitial {
  handle: string;
  name: string;
  bio: string;
  year: string;
  branch: string;
}

function clientError(values: EditProfileInitial): string | null {
  if (!HANDLE_RE.test(values.handle.trim())) {
    return "Handle must be 3-20 characters: letters, numbers, underscores.";
  }
  const name = values.name.trim();
  if (name.length < 1 || name.length > MAX_NAME) {
    return "Name must be 1-50 characters.";
  }
  if (values.bio.trim().length > MAX_BIO) {
    return `Bio must be at most ${MAX_BIO} characters.`;
  }
  if (values.year.trim().length > MAX_YEAR) {
    return `Year must be at most ${MAX_YEAR} characters.`;
  }
  if (values.branch.trim().length > MAX_BRANCH) {
    return `Branch must be at most ${MAX_BRANCH} characters.`;
  }
  return null;
}

const inputClass =
  "w-full rounded-lg border border-ig-border bg-white px-3 py-2 text-sm text-ig-text outline-none focus:border-ig-blue dark:border-white/10 dark:bg-white/5 dark:text-white";

export function EditProfileModal({
  initial,
  onClose,
}: {
  initial: EditProfileInitial;
  onClose: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function set<K extends keyof EditProfileInitial>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = clientError(values);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await updateProfile({
        handle: values.handle.trim(),
        name: values.name.trim(),
        bio: values.bio.trim(),
        year: values.year.trim(),
        branch: values.branch.trim(),
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        router.refresh();
        onClose();
      }
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setPending(false);
    }
  }

  const bioLeft = MAX_BIO - values.bio.trim().length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-ig-text dark:text-white">
          Edit profile
        </h2>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ig-secondary">
            Handle
            <input
              aria-label="Handle"
              value={values.handle}
              onChange={(e) => set("handle", e.target.value)}
              maxLength={20}
              autoComplete="off"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ig-secondary">
            Name
            <input
              aria-label="Name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={MAX_NAME}
              autoComplete="off"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-ig-secondary">
            Bio
            <textarea
              aria-label="Bio"
              value={values.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxLength={MAX_BIO}
              rows={3}
              className={`${inputClass} resize-none`}
            />
            <span className="self-end font-normal">{bioLeft} left</span>
          </label>
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-ig-secondary">
              Year
              <input
                aria-label="Year"
                value={values.year}
                onChange={(e) => set("year", e.target.value)}
                maxLength={MAX_YEAR}
                autoComplete="off"
                placeholder="4th"
                className={inputClass}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-ig-secondary">
              Branch
              <input
                aria-label="Branch"
                value={values.branch}
                onChange={(e) => set("branch", e.target.value)}
                maxLength={MAX_BRANCH}
                autoComplete="off"
                placeholder="CSE"
                className={inputClass}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-xs text-rose-500">
              {error}
            </p>
          )}
          <div className="mt-1 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={pending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
