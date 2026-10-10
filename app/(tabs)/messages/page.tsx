"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { InfoRail } from "@/components/chat/InfoRail";
import {
  conversations,
  messagesById,
  type Conversation,
  type Message,
} from "@/lib/mock-data";
import { getMyMeetups } from "@/lib/actions/meetups";
import { cn } from "@/lib/utils";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [convs, setConvs] = useState<Conversation[]>(conversations);
  const [threads, setThreads] = useState<Record<string, Message[]>>(messagesById);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [infoOpen, setInfoOpen] = useState(false);

  const conversation = convs.find((c) => c.id === activeId) ?? convs[0];
  const messages = threads[conversation.id] ?? [];

  // Real meetup rows merged into the mock threads: each request involving
  // the viewer becomes a "[meetup:<id>] …" message (rendered as MeetupCard
  // by ChatWindow) in the 1:1 thread keyed by the other party's handle.
  // Threads for unknown handles are appended to the list. Mock send-logic
  // below is untouched.
  useEffect(() => {
    let live = true;
    getMyMeetups().then((res) => {
      if (!live || !res.ok) return;
      const merged: Conversation[] = [...conversations];
      for (const m of res.meetups) {
        if (!merged.some((c) => c.handle === m.otherHandle)) {
          merged.unshift({
            id: `dm-${m.otherHandle}`,
            name: m.otherName,
            handle: m.otherHandle,
            preview: `Meetup request: ${m.place}`,
            time: "Now",
            unread: m.direction === "incoming" && m.status === "pending" ? 1 : 0,
            online: false,
            initials: initialsOf(m.otherName),
          });
        }
      }
      setConvs(merged);
      setThreads((prev) => {
        const next: Record<string, Message[]> = { ...prev };
        const idByHandle = new Map(merged.map((c) => [c.handle, c.id]));
        for (const m of res.meetups) {
          const tid = idByHandle.get(m.otherHandle);
          if (!tid) continue;
          const existing = next[tid] ?? [];
          if (existing.some((x) => x.text.includes(`[meetup:${m.id}]`))) continue;
          next[tid] = [
            ...existing,
            {
              id: `meetup-${m.id}`,
              from: m.direction === "outgoing" ? "me" : "them",
              text: `[meetup:${m.id}] Meetup request: ${m.place}${m.note ? ` — ${m.note}` : ""}`,
              time: "Now",
            },
          ];
        }
        return next;
      });
    });
    return () => {
      live = false;
    };
  }, []);

  function handleSelect(id: string) {
    setActiveId(id);
    setMobileView("chat");
    setInfoOpen(false);
  }

  function handleSend(text: string) {
    const msg: Message = {
      id: `m${Date.now()}`,
      from: "me",
      text,
      time: "Now",
    };
    setThreads((prev) => ({
      ...prev,
      [conversation.id]: [...(prev[conversation.id] ?? []), msg],
    }));
  }

  return (
    <div
      className={cn(
        "animate-fade-up -m-4 flex h-[calc(100dvh-3.5rem-4rem-2rem)] w-[calc(100%+2rem)] flex-col overflow-x-clip",
        // Break out of the AppShell max-w-2xl container on desktop and fill
        // the full content width (viewport minus fixed sidebar, minus gutters).
        "lg:-my-4 lg:ml-[calc(-1*((100vw-15rem-42rem)/2)-1rem)] lg:h-dvh lg:w-[calc(100vw-15rem-2rem)]"
      )}
    >
      <button
        type="button"
        onClick={() => setMobileView("list")}
        className={cn(
          "mx-4 mt-3 items-center gap-1 text-sm font-semibold text-ig-text dark:text-white md:hidden",
          mobileView === "chat" ? "inline-flex" : "hidden"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex min-h-0 flex-1 flex-col bg-surface md:grid md:grid-cols-[300px_minmax(0,1fr)] md:gap-2 md:bg-transparent xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <div
          className={cn(
            "min-h-0 flex-1 flex-col md:flex",
            mobileView === "chat" ? "hidden md:flex" : "flex"
          )}
        >
          <div className="shrink-0 px-4 py-3">
            <h1 className="text-base font-bold text-ig-text dark:text-white">Messages</h1>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList
              conversations={convs}
              activeId={conversation.id}
              onSelect={handleSelect}
            />
          </div>
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 flex-col md:flex",
            mobileView === "list" ? "hidden md:flex" : "flex"
          )}
        >
          <ChatWindow
            conversation={conversation}
            messages={messages}
            onSend={handleSend}
            onToggleInfo={() => setInfoOpen((v) => !v)}
            infoOpen={infoOpen}
          />
        </div>

        <div
          className={cn(
            "min-h-0 flex-col border-ig-border dark:border-white/10",
            mobileView === "list"
              ? "hidden"
              : infoOpen
                ? "flex border-t xl:flex"
                : "hidden xl:flex"
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <InfoRail conversation={conversation} messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
}
