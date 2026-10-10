"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { InfoRail } from "@/components/chat/InfoRail";
import { Card } from "@/components/ui/card";
import { conversations, messagesById, type Message } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [threads, setThreads] = useState<Record<string, Message[]>>(messagesById);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [infoOpen, setInfoOpen] = useState(false);

  const conversation = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const messages = threads[conversation.id] ?? [];

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
    <div className="animate-fade-up mx-auto w-full max-w-6xl">
      <button
        type="button"
        onClick={() => setMobileView("list")}
        className={cn(
          "mb-2 items-center gap-1 text-sm font-semibold text-ig-text dark:text-white md:hidden",
          mobileView === "chat" ? "inline-flex" : "hidden"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <Card className="grid min-h-[70vh] overflow-hidden md:grid-cols-[300px_1fr] xl:grid-cols-[280px_1fr_260px]">
        <div
          className={cn(
            "min-h-0 border-ig-border dark:border-white/10 md:border-r",
            mobileView === "chat" ? "hidden md:block" : "block"
          )}
        >
          <div className="border-b border-ig-border px-3 py-3 dark:border-white/10">
            <h1 className="text-sm font-bold text-ig-text dark:text-white">Messages</h1>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            <ConversationList
              conversations={conversations}
              activeId={conversation.id}
              onSelect={handleSelect}
            />
          </div>
        </div>

        <div
          className={cn(
            "min-h-[70vh]",
            mobileView === "list" ? "hidden md:block" : "block"
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
            "min-h-0 border-ig-border dark:border-white/10 xl:border-l",
            mobileView === "list" ? "hidden" : infoOpen ? "block border-t xl:block" : "hidden xl:block"
          )}
        >
          <div className="max-h-[70vh] overflow-y-auto">
            <InfoRail conversation={conversation} messages={messages} />
          </div>
        </div>
      </Card>
    </div>
  );
}
