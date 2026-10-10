"use client";

import { useState } from "react";
import Link from "next/link";
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
import type { FeedPost } from "@/lib/feed";
import { addComment, bumpShare, toggleFollow, toggleLike } from "@/lib/actions/social";

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState(post.comments);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [shares, setShares] = useState(post.shares);
  const [following, setFollowing] = useState(post.authorFollowed);
  const [error, setError] = useState<string | null>(null);

  async function onToggleLike() {
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    setError(null);
    try {
      const res = await toggleLike(post.id);
      if (!res.ok) {
        setLiked(prevLiked);
        setLikeCount(prevCount);
        setError(res.error);
      } else {
        setLiked(res.liked);
        setLikeCount(res.count);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      setError("Something went wrong, try again");
    }
  }

  async function onAddComment() {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await addComment(post.id, text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setComments((prev) => [
        ...prev,
        { user: res.comment.author, text: res.comment.body },
      ]);
      setDraft("");
    } catch {
      setError("Something went wrong, try again");
    } finally {
      setPosting(false);
    }
  }

  async function onShare() {
    // Copy deep link first (silent fallback), then count the share.
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/#post-${post.id}`
      );
    } catch {
      // Clipboard unavailable — share still counts.
    }
    const prev = shares;
    setShares(prev + 1);
    try {
      const res = await bumpShare(post.id);
      if (!res.ok) {
        setShares(prev);
        setError(res.error);
      } else {
        setShares(res.shares);
      }
    } catch {
      setShares(prev);
      setError("Something went wrong, try again");
    }
  }

  async function onToggleFollow() {
    const prev = following;
    setFollowing(!prev);
    setError(null);
    try {
      const res = await toggleFollow(post.author);
      if (!res.ok) {
        setFollowing(prev);
        setError(res.error);
      } else {
        setFollowing(res.following);
      }
    } catch {
      setFollowing(prev);
      setError("Something went wrong, try again");
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3" id={`post-${post.id}`}>
        <div className="flex items-center gap-3">
          <Avatar name={post.authorInitials} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-sm font-semibold text-ig-text dark:text-white">
              <Link
                href={`/profile/${post.author}`}
                className="truncate hover:underline"
              >
                @{post.author}
              </Link>
              {post.verified && (
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-ig-blue"
                  aria-label="Verified"
                />
              )}
              <span className="shrink-0 font-normal text-ig-secondary">
                · {post.time}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-ig-secondary">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{post.location}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleFollow}
            aria-pressed={following}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
              following
                ? "bg-ig-subtle text-ig-secondary dark:bg-white/10 dark:text-white/70"
                : "bg-ig-blue text-white"
            )}
          >
            {following ? "Following" : "Follow"}
          </button>
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
            onClick={onToggleLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            className="flex items-center gap-1.5 text-sm text-ig-text transition-transform duration-150 hover:scale-105 active:scale-95 dark:text-white"
          >
            <Heart
              key={String(liked)}
              className={cn(
                "h-5 w-5",
                liked ? "fill-rose-500 text-rose-500" : "text-ig-text dark:text-white",
                liked && "animate-like-pop"
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
            onClick={onShare}
            aria-label="Share"
            className="flex items-center gap-1.5 text-ig-text dark:text-white"
          >
            <Send className="h-5 w-5" />
            {shares > 0 && (
              <span className="text-sm font-medium">{shares}</span>
            )}
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

        {post.likedBy.length > 0 && (
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
        )}

        {error && (
          <p role="alert" className="text-xs text-rose-500">
            {error}
          </p>
        )}

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
              if (e.key === "Enter") void onAddComment();
            }}
            placeholder="Add a comment..."
            aria-label="Add a comment"
            className="flex-1 bg-transparent text-sm text-ig-text outline-none placeholder:text-ig-secondary dark:text-white"
          />
          <button
            type="button"
            onClick={() => void onAddComment()}
            disabled={!draft.trim() || posting}
            className="text-sm font-semibold text-ig-blue disabled:opacity-40"
          >
            Post
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
