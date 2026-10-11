import { Suspense } from "react";
import { auth } from "@/auth";
import { getFeed } from "@/lib/feed";
import { PostCard } from "@/components/feed/PostCard";
import { PostSkeleton } from "@/components/feed/PostSkeleton";

function FeedSkeleton() {
  return (
    <>
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </>
  );
}

async function FeedList() {
  const session = await auth();
  const posts = await getFeed(session?.user?.id);
  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </>
  );
}

export default function Home() {
  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Suspense fallback={<FeedSkeleton />}>
        <FeedList />
      </Suspense>
    </div>
  );
}
