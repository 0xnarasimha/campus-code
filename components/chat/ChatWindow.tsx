"use client";

import { useState } from "react";
import { Info, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

export function ChatWindow({ conversation, messages, onSend, onToggleInfo, infoOpen }: ChatWindowProps) {
  const [draft, setDraft] = useState("");

  function send() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-ig-border px-4 py-3 dark:border-white/10">
        <span className="relative">
          <Avatar name={conversation.initials} />
          {conversation.online && (
            <span
              aria-label="Online"
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ig-text dark:text-white">
            {conversation.name}
          </p>
          <p className="text-xs text-ig-secondary">
            {conversation.online ? "Active now" : `@${conversation.handle}`}
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

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
        {messages.map((m) => {
          const mine = m.from === "me";
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-6",
                  mine
                    ? "rounded-br-md bg-ig-blue text-white"
                    : "rounded-bl-md bg-ig-subtle text-ig-text dark:bg-white/10 dark:text-white"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p
                  className={cn(
                    "mt-0.5 text-right text-[11px]",
                    mine ? "text-white/70" : "text-ig-secondary"
                  )}
                >
                  {m.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-1">
        {QUICK_PILLS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setDraft((d) => (d ? `${d} ${p.text}` : p.text))}
            className="shrink-0 rounded-full border border-ig-border px-2.5 py-1 text-xs font-medium text-ig-secondary hover:bg-ig-subtle dark:border-white/10 dark:hover:bg-white/10"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-ig-border px-4 py-3 dark:border-white/10">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={`Message ${conversation.name}...`}
          aria-label="Message input"
          className="h-10 flex-1 rounded-full bg-ig-subtle px-4 text-sm text-ig-text outline-none placeholder:text-ig-secondary dark:bg-white/10 dark:text-white"
        />
        <Button size="icon" onClick={send} disabled={!draft.trim()} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
