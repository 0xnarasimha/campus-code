"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminDelete, adminLogoutAction } from "@/lib/actions/admin";
import type { AdminRow } from "@/lib/admin-data";

// Per-table latest-rows list with a Delete button per row: confirm()
// before deleting, optimistic removal, server error display.
export function AdminTable({
  table,
  title,
  rows,
}: {
  table: string;
  title: string;
  rows: AdminRow[];
}) {
  const [items, setItems] = useState<AdminRow[]>(rows);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function onDelete(row: AdminRow) {
    if (
      !window.confirm(`Delete this ${title.slice(0, -1).toLowerCase()}?\n\n${row.label}`)
    ) {
      return;
    }
    setError(null);
    setPendingId(row.id);
    const previous = items;
    setItems((cur) => cur.filter((r) => r.id !== row.id));
    try {
      const result = await adminDelete({ table, id: row.id });
      if (!result.ok) {
        setItems(previous);
        setError(result.error);
      }
    } catch {
      setItems(previous);
      setError("Delete failed. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="border border-ig-border bg-surface">
      <h2 className="border-b border-ig-border px-4 py-3 text-base font-bold text-ig-text">
        {title}{" "}
        <span className="font-normal text-ig-secondary">({items.length})</span>
      </h2>
      {error && (
        <p role="alert" className="px-4 pt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ig-secondary">No rows.</p>
      ) : (
        <ul className="divide-y divide-ig-border">
          {items.map((row) => (
            <li
              key={row.id}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ig-text">
                  {row.label}
                </p>
                <p className="truncate text-xs text-ig-secondary">{row.sub}</p>
              </div>
              <button
                type="button"
                disabled={pendingId === row.id}
                onClick={() => onDelete(row)}
                className="shrink-0 rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition-opacity hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                {pendingId === row.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      await adminLogoutAction();
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onLogout}
      className="rounded border border-ig-border bg-surface px-4 py-2 text-sm font-semibold text-ig-text disabled:opacity-60"
    >
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
