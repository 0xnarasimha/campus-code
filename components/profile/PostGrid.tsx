"use client";

import { Award, Code2, GitCommitHorizontal, Star } from "lucide-react";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileGridItem } from "@/lib/mock-data";

type CardKind = "badge" | "code" | "rating" | "commit";

const KINDS: CardKind[] = ["badge", "code", "rating", "commit"];

const KIND_STYLES: Record<CardKind, string> = {
  badge: "bg-gradient-to-br from-amber-500 to-orange-700",
  code: "bg-gradient-to-br from-zinc-800 to-zinc-950",
  rating: "bg-gradient-to-br from-violet-600 to-purple-900",
  commit: "bg-gradient-to-br from-emerald-600 to-teal-900",
};

const KIND_ICONS: Record<CardKind, typeof Award> = {
  badge: Award,
  code: Code2,
  rating: Star,
  commit: GitCommitHorizontal,
};

function kindFor(item: ProfileGridItem): CardKind {
  const n = item.id.charCodeAt(item.id.length - 1);
  return KINDS[n % KINDS.length];
}

function countsFor(item: ProfileGridItem): { likes: number; comments: number } {
  const n = [...item.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return { likes: 40 + (n % 180), comments: 3 + (n % 24) };
}

export function PostGrid({ items }: { items: ProfileGridItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2" role="list">
      {items.map((item) => {
        const kind = kindFor(item);
        const Icon = KIND_ICONS[kind];
        const { likes, comments } = countsFor(item);
        return (
          <article
            key={item.id}
            role="listitem"
            tabIndex={0}
            className={cn(
              "group relative flex aspect-square flex-col justify-between overflow-hidden rounded-md p-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:p-3",
              KIND_STYLES[kind]
            )}
          >
            <Icon className="h-5 w-5 opacity-80" aria-hidden />
            <div className="min-w-0">
              <h3 className="truncate text-xs font-semibold sm:text-sm">
                {item.title}
              </h3>
              <p className="truncate font-mono text-[10px] text-white/70 sm:text-xs">
                {item.meta}
              </p>
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100"
              aria-hidden
            >
              <span className="flex items-center gap-1 text-sm font-semibold">
                <Heart className="h-5 w-5 fill-current transition-transform duration-150 group-hover:scale-125" />
                {likes}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold">
                <MessageCircle className="h-5 w-5 fill-current" />
                {comments}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
