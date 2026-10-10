// Feed ranking algorithm (pure — no db imports, unit-probeable).
//
// Weights:
//   like    = 3 pts
//   comment = 5 pts
//   share   = 2 pts
//   followed author bonus = +10 pts (flat, before decay)
// Recency: exponential half-life decay, 2^(-ageHours / 24) — a post loses
// half its base score every 24h.
// Total: base * (0.3 + 0.7 * recency). The 0.3 floor keeps high-engagement
// old posts visible instead of decaying to zero.

export interface ScoreInput {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  authorFollowed: boolean;
  now?: Date;
}

export const FEED_WEIGHTS = {
  like: 3,
  comment: 5,
  share: 2,
  followedBonus: 10,
  recencyHalfLifeHours: 24,
  recencyFloor: 0.3,
} as const;

export function scorePost(input: ScoreInput): number {
  const now = input.now ?? new Date();
  const ageHours = Math.max(
    0,
    (now.getTime() - input.createdAt.getTime()) / 3_600_000
  );
  const base =
    input.likeCount * FEED_WEIGHTS.like +
    input.commentCount * FEED_WEIGHTS.comment +
    input.shareCount * FEED_WEIGHTS.share +
    (input.authorFollowed ? FEED_WEIGHTS.followedBonus : 0);
  const recency = Math.pow(2, -ageHours / FEED_WEIGHTS.recencyHalfLifeHours);
  return base * (FEED_WEIGHTS.recencyFloor + (1 - FEED_WEIGHTS.recencyFloor) * recency);
}

export function rankFeed<T extends ScoreInput>(posts: T[]): T[] {
  return [...posts].sort((a, b) => scorePost(b) - scorePost(a));
}
