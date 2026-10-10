"use client";

import { PostCard } from "@/components/feed/PostCard";
import { PostSkeleton } from "@/components/feed/PostSkeleton";
import { StoryRow } from "@/components/feed/StoryRow";
import { posts } from "@/lib/mock-data";
import { useSimulatedLoad } from "@/lib/use-simulated-load";

export default function Home() {
  const loading = useSimulatedLoad(800);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <StoryRow />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
