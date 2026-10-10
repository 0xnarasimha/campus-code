"use client";

import { Code2, Link2, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { students, type Conversation, type Message } from "@/lib/mock-data";

interface InfoRailProps {
  conversation: Conversation;
  messages: Message[];
}

const FALLBACK_LINKS = [
  { label: "leetcode.com · Two Sum", url: "https://leetcode.com/problems/two-sum/" },
  { label: "Campus Hub · Night Labs", url: "https://hub.mbu.dev/night-labs" },
];

const FALLBACK_SNIPPET = `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`;

const URL_RE = /https?:\/\/[^\s`)"']+/g;

function isGroup(conversation: Conversation) {
  return (
    conversation.id === "guild" ||
    /guild|group|club|team|algo/i.test(conversation.name)
  );
}

function shortUrl(url: string) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 18 ? `${u.pathname.slice(0, 18)}…` : u.pathname;
    return `${u.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return url.length > 32 ? `${url.slice(0, 32)}…` : url;
  }
}

export function InfoRail({ conversation, messages }: InfoRailProps) {
  const links = messages.flatMap((m) => m.text.match(URL_RE) ?? []);
  const uniqueLinks = [...new Set(links)];
  const linkItems =
    uniqueLinks.length > 0
      ? uniqueLinks.slice(0, 5).map((url) => ({ label: shortUrl(url), url }))
      : FALLBACK_LINKS;

  const snippetMessages = messages.filter(
    (m) => m.text.includes("```") || m.text.includes("\n")
  );
  const snippets =
    snippetMessages.length > 0
      ? snippetMessages.slice(0, 3).map((m) => ({
          id: m.id,
          meta: `${m.from === "me" ? "You" : conversation.name} · ${m.time}`,
          code: m.text.replace(/```\w*\n?|```/g, "").trim().slice(0, 320),
        }))
      : [{ id: "fallback", meta: "Pinned · Python", code: FALLBACK_SNIPPET }];

  const group = isGroup(conversation);
  const members = group ? students.slice(0, 4) : [];

  return (
    <aside aria-label="Conversation info" className="flex flex-col gap-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="relative shrink-0">
          <Avatar name={conversation.initials} />
          {conversation.online && (
            <span
              aria-label="Online"
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950"
            />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ig-text dark:text-white">
            {conversation.name}
          </p>
          <p className="truncate text-xs text-ig-secondary">
            @{conversation.handle} · {conversation.online ? "Active now" : "Away"}
          </p>
        </div>
      </div>

      {/* Shared links */}
      <section aria-label="Shared links">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ig-secondary">
          <Link2 className="h-3.5 w-3.5" />
          Shared links
        </h2>
        <ul className="flex flex-col gap-1.5">
          {linkItems.map((l) => (
            <li key={l.url}>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate rounded-lg bg-ig-subtle px-2.5 py-2 text-xs font-medium text-ig-blue hover:underline dark:bg-white/10"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Shared snippets */}
      <section aria-label="Shared snippets">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ig-secondary">
          <Code2 className="h-3.5 w-3.5" />
          Shared snippets
        </h2>
        <div className="flex flex-col gap-2">
          {snippets.map((s) => (
            <div
              key={s.id}
              className="overflow-hidden rounded-2xl bg-ig-subtle dark:bg-white/5"
            >
              <p className="px-2.5 py-1.5 text-[11px] font-medium text-ig-secondary">
                {s.meta}
              </p>
              <pre className="max-h-32 overflow-auto p-2.5 text-ig-text dark:text-white">
                <code className="whitespace-pre-wrap break-words">{s.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* Members / peer card */}
      <section aria-label={group ? "Members" : "About"}>
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ig-secondary">
          <Users className="h-3.5 w-3.5" />
          {group ? "Members" : "About"}
        </h2>
        {group ? (
          <ul className="flex flex-col gap-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <Avatar name={m.avatarInitials} className="h-7 w-7 text-xs" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ig-text dark:text-white">
                    {m.name}
                  </p>
                  <p className="truncate text-[11px] text-ig-secondary">
                    @{m.handle}
                  </p>
                </div>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <Avatar name="YO" className="h-7 w-7 bg-ig-blue text-xs text-white" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-ig-text dark:text-white">
                  You
                </p>
                <p className="truncate text-[11px] text-ig-secondary">Member</p>
              </div>
            </li>
          </ul>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-ig-subtle p-2.5 dark:bg-white/10">
            <Avatar name={conversation.initials} className="h-8 w-8 text-xs" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-ig-text dark:text-white">
                {conversation.name}
              </p>
              <p className="truncate text-[11px] text-ig-secondary">
                {conversation.online ? "Active now" : `@${conversation.handle}`}
              </p>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}
