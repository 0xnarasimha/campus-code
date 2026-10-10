"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Send,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/mock-data";

function initialsFromHandle(handle: string) {
  const parts = handle.split(/[._-]+/).filter(Boolean);
  const letters = parts.map((p) => p[0]).slice(0, 2).join("");
  return (letters || handle.slice(0, 2)).toUpperCase();
}

export function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [draft, setDraft] = useState("");

  const likeCount = post.likes + (liked ? 1 : 0);

  function addComment() {
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [...prev, { user: "karthik_dev", text }]);
    setDraft("");
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={initialsFromHandle(post.author)} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-sm font-semibold text-ig-text dark:text-white">
              <span className="truncate">@{post.author}</span>
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-ig-blue"
                aria-label="Verified"
              />
              <span className="shrink-0 font-normal text-ig-secondary">
                · {post.time}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-ig-secondary">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{post.location}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ig-text dark:text-white">
            {post.topic}
          </h2>
          <p className="mt-1 text-sm leading-6 text-ig-text dark:text-white/90">
            {post.desc}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-ig-subtle px-2.5 py-0.5 font-mono text-xs text-ig-secondary dark:bg-white/10 dark:text-white/80"
            >
              #{tag}
            </span>
          ))}
        </div>

        {post.code && (
          <div className="overflow-hidden rounded-lg bg-zinc-900">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 font-mono text-[11px] text-zinc-400">
              <span>{post.code.file}</span>
              <span>{post.code.lang}</span>
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-xs leading-5 text-zinc-100">
              <code>{post.code.snippet}</code>
            </pre>
          </div>
        )}

        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            className="flex items-center gap-1.5 text-sm text-ig-text dark:text-white"
          >
            <Heart
              className={cn(
                "h-5 w-5",
                liked ? "fill-rose-500 text-rose-500" : "text-ig-text dark:text-white"
              )}
            />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          <button
            type="button"
            aria-label="Comments"
            className="flex items-center text-ig-text dark:text-white"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Share"
            className="flex items-center text-ig-text dark:text-white"
          >
            <Send className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            aria-pressed={saved}
            aria-label={saved ? "Unsave" : "Save"}
            className="ml-auto flex items-center text-ig-text dark:text-white"
          >
            <Bookmark
              className={cn("h-5 w-5", saved && "fill-current")}
            />
          </button>
        </div>

        <p className="text-xs text-ig-secondary">
          Liked by <span className="font-semibold">{post.likedBy[0]}</span>
          {likeCount > 1 && (
            <>
              {" "}and{" "}
              <span className="font-semibold">
                {(likeCount - 1).toLocaleString()} others
              </span>
            </>
          )}
        </p>

        <ul className="flex flex-col gap-1">
          {comments.map((c, i) => (
            <li key={`${c.user}-${i}`} className="text-sm">
              <span className="font-semibold text-ig-text dark:text-white">
                {c.user}
              </span>{" "}
              <span className="text-ig-text dark:text-white/90">{c.text}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 border-t border-ig-border pt-2 dark:border-white/10">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addComment();
            }}
            placeholder="Add a comment..."
            aria-label="Add a comment"
            className="flex-1 bg-transparent text-sm text-ig-text outline-none placeholder:text-ig-secondary dark:text-white"
          />
          <button
            type="button"
            onClick={addComment}
            disabled={!draft.trim()}
            className="text-sm font-semibold text-ig-blue disabled:opacity-40"
          >
            Post
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
