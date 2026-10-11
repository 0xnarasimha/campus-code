import { redirect } from "next/navigation";
import { Suspense } from "react";
import { verifyAdminRequest } from "@/lib/admin-auth";
import {
  ADMIN_TABLES,
  getAdminLatest,
  getAdminStats,
  type AdminTable as AdminTableName,
} from "@/lib/admin-data";
import { AdminLogoutButton, AdminTable } from "./admin-table";

// Admin overview. The middleware already redirects unauthenticated
// /admin* traffic to /admin/login; the server-side check below is defense
// in depth so the panel never renders without a valid admin session.
//
// Cache Components note: verifyAdminRequest reads cookies() (a request-time
// API), so the data load lives behind <Suspense> — during prerender it
// suspends and only the fallback ships in the static shell.
export default function AdminPage() {
  return (
    <div className="min-h-dvh w-full bg-bg px-4 py-8">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Suspense
          fallback={
            <p className="text-sm text-ig-secondary">Loading admin…</p>
          }
        >
          <AdminPanel />
        </Suspense>
      </main>
    </div>
  );
}

async function AdminPanel() {
  if (!(await verifyAdminRequest())) {
    redirect("/admin/login");
  }
  const [stats, latest] = await Promise.all([
    getAdminStats(),
    getAdminLatest(),
  ]);

  const cards: Array<{ key: string; label: string }> = [
    { key: "users", label: "Users" },
    { key: "posts", label: "Posts" },
    { key: "comments", label: "Comments" },
    { key: "clubs", label: "Clubs" },
    { key: "events", label: "Events" },
    { key: "spots", label: "Spots" },
    { key: "meetups", label: "Meetups" },
    { key: "follows", label: "Follows" },
    { key: "rsvps", label: "RSVPs" },
  ];

  const sections: Array<{ table: AdminTableName; title: string }> =
    ADMIN_TABLES.map((table) => ({
      table,
      title:
        table === "clubEvent"
          ? "Events"
          : table === "studySpot"
            ? "Study spots"
            : table === "meetupRequest"
              ? "Meetup requests"
              : `${table[0].toUpperCase()}${table.slice(1)}s`,
    }));

  return (
    <>
      <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ig-text">Admin</h1>
            <p className="text-sm text-ig-secondary">
              Restricted area. Deletions are immediate and permanent.
            </p>
          </div>
          <AdminLogoutButton />
        </header>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.key}
              className="border border-ig-border bg-surface px-3 py-4 text-center"
            >
              <p className="text-2xl font-bold text-ig-text">
                {stats[card.key] ?? 0}
              </p>
              <p className="mt-0.5 text-xs text-ig-secondary">{card.label}</p>
            </div>
          ))}
        </div>

        {sections.map((section) => (
          <AdminTable
            key={section.table}
            table={section.table}
            title={section.title}
            rows={latest[section.table]}
          />
        ))}
    </>
  );
}
