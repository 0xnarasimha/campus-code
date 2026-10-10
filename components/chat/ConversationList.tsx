"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/mock-data";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  return (
    <ul className="flex flex-col gap-1 p-2" role="listbox" aria-label="Conversations">
      {conversations.map((c) => {
        const active = c.id === activeId;
        return (
          <li key={c.id}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => onSelect(c.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                active
                  ? "bg-ig-subtle dark:bg-white/10"
                  : "hover:bg-ig-subtle/60 dark:hover:bg-white/5"
              )}
            >
              <span className="relative shrink-0">
                <Avatar name={c.initials} />
                {c.online && (
                  <span
                    aria-label="Online"
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ig-text dark:text-white">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-xs text-ig-secondary">{c.time}</span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-ig-secondary">
                    @{c.handle} · {c.preview}
                  </span>
                  {c.unread > 0 && (
                    <span
                      aria-label={`${c.unread} unread`}
                      className="h-2 w-2 shrink-0 rounded-full bg-ig-blue"
                    />
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
