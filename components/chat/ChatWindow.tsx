"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MeetupCard } from "@/components/chat/MeetupCard";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/lib/mock-data";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onSend: (text: string) => void;
  onToggleInfo?: () => void;
  infoOpen?: boolean;
}

const QUICK_PILLS = [
  { label: "Share Table Location", text: "I'm at Table 14, Library Pod 7 — join me!" },
  { label: "Send LeetCode Link", text: "https://leetcode.com/problems/two-sum/" },
  { label: "Send Code Snippet", text: "```python\ndef two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i\n```" },
];

// DM-thread meetup card: a message carrying "[meetup:<id>]" renders the
// MeetupCard (request row: place/note/status + recipient Accept/Decline)
// above the plain text. Send-logic below is untouched.
function meetupIdOf(text: string): string | null {
  const m = /\[meetup:([A-Za-z0-9_-]+)\]/.exec(text);
  return m ? (m[1] as string) : null;
}

function stripMarker(text: string): string {
  return text.replace(/\[meetup:[A-Za-z0-9_-]+\]\s*/, "").trim();
}

export function ChatWindow({ conversation, messages, onSend, onToggleInfo, infoOpen }: ChatWindowProps) {
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-ig-border px-4 py-3 dark:border-white/10 md:px-5 md:py-4">
        <span className="relative">
          <Avatar name={conversation.initials} className="h-12 w-12 text-base" />
          {conversation.online && (
            <span
              aria-label="Online"
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-ig-text dark:text-white">
            <Link
              href={`/profile/${conversation.handle}`}
              className="hover:underline"
            >
              {conversation.name}
            </Link>
          </p>
          <p className="truncate text-sm text-ig-secondary">
            {conversation.online ? "Active now" : "Away"}
            <span aria-hidden="true"> · </span>
            <Link
              href={`/profile/${conversation.handle}`}
              className="hover:underline"
            >
              @{conversation.handle}
            </Link>
          </p>
        </div>
        {onToggleInfo && (
          <button
            type="button"
            onClick={onToggleInfo}
            aria-label="Toggle conversation info"
            aria-pressed={infoOpen}
            className="rounded-full p-2 text-ig-secondary hover:bg-ig-subtle dark:hover:bg-white/10 xl:hidden"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 md:px-5">
        {messages.map((m) => {
          const mine = m.from === "me";
          const meetupId = meetupIdOf(m.text);
          const text = meetupId ? stripMarker(m.text) : m.text;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className="flex max-w-[80%] flex-col gap-2">
                {meetupId && <MeetupCard meetupId={meetupId} />}
                {text && (
              <div
                className={cn(
                  "rounded-3xl px-5 py-3 text-base leading-7",
                  mine
                    ? "rounded-br-lg bg-ig-blue text-white"
                    : "rounded-bl-lg bg-ig-subtle text-ig-text dark:bg-white/10 dark:text-white"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{text}</p>
                <p
                  className={cn(
                    "mt-0.5 text-right text-[11px]",
                    mine ? "text-white/70" : "text-ig-secondary"
                  )}
                >
                  {m.time}
                </p>
              </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-2 pt-1 md:px-5">
        {QUICK_PILLS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setDraft((d) => (d ? `${d} ${p.text}` : p.text))}
            className="shrink-0 rounded-full border border-ig-border px-3 py-1.5 text-sm font-medium text-ig-secondary hover:bg-ig-subtle dark:border-white/10 dark:hover:bg-white/10"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-ig-border px-4 py-4 dark:border-white/10 md:px-5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={`Message ${conversation.name}...`}
          aria-label="Message input"
          className="h-14 flex-1 rounded-full bg-ig-subtle px-5 text-base text-ig-text outline-none placeholder:text-ig-secondary dark:bg-white/10 dark:text-white"
        />
        <Button
          size="icon"
          onClick={send}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="h-14 w-14 shrink-0 rounded-full"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
