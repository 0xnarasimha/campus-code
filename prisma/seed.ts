import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { posts, spots, students } from "../lib/mock-data";

const prisma = new PrismaClient();

// DEV-ONLY seed password. Every seeded user gets password `devdb1234`
// (bcrypt cost 12). Change or remove these accounts after testing;
// never use this password in production.
const DEV_PASSWORD = "devdb1234";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);

  // 1. Users — upsert by handle (rerunnable, no wipes needed).
  // Email is derived since mock students carry no email: <handle>@mbu.edu.
  for (const s of students) {
    await prisma.user.upsert({
      where: { handle: s.handle },
      update: {
        name: s.name,
        passwordHash,
        year: s.year,
        branch: s.branch,
        avatarInitials: s.avatarInitials,
        verified: s.verified,
        points: s.points,
        solved: s.solved,
        cfRating: s.cfRating,
        lcSolved: s.lcSolved,
        commits: s.commits,
      },
      create: {
        id: s.id,
        handle: s.handle,
        name: s.name,
        email: `${s.handle}@mbu.edu`,
        passwordHash,
        year: s.year,
        branch: s.branch,
        avatarInitials: s.avatarInitials,
        verified: s.verified,
        points: s.points,
        solved: s.solved,
        cfRating: s.cfRating,
        lcSolved: s.lcSolved,
        commits: s.commits,
      },
    });
  }

  // Handle -> user id lookup for post/like/comment attribution.
  const users = await prisma.user.findMany({ select: { id: true, handle: true } });
  const idByHandle = new Map(users.map((u) => [u.handle, u.id]));
  const fallbackId = (i: number): string => {
    const s = students[i % students.length];
    const id = idByHandle.get(s.handle);
    if (!id) throw new Error(`seed: missing user for handle ${s.handle}`);
    return id;
  };
  const resolveAuthor = (handle: string, i: number): string =>
    idByHandle.get(handle) ?? fallbackId(i);

  // 2. Posts (+ likes + comments) — mock post authors predate the
  // student roster, so unknown handles fall back round-robin to students.
  // Staggered ages (hours) keep the ranking demo varied on every reseed.
  const SEED_AGE_HOURS = [2, 5, 26, 50];
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const authorId = resolveAuthor(p.author, i);
    const createdAt = new Date(
      Date.now() - (SEED_AGE_HOURS[i % SEED_AGE_HOURS.length] ?? 2) * 3_600_000
    );
    await prisma.post.upsert({
      where: { id: p.id },
      update: {
        authorId,
        topic: p.topic,
        body: p.desc,
        location: p.location,
        tags: p.tags,
        codeFile: p.code?.file ?? null,
        codeLang: p.code?.lang ?? null,
        codeSnippet: p.code?.snippet ?? null,
        createdAt,
      },
      create: {
        id: p.id,
        authorId,
        topic: p.topic,
        body: p.desc,
        location: p.location,
        tags: p.tags,
        codeFile: p.code?.file ?? null,
        codeLang: p.code?.lang ?? null,
        codeSnippet: p.code?.snippet ?? null,
        createdAt,
      },
    });

    // Likes: known student handles only; unknown likers are skipped.
    for (const handle of p.likedBy) {
      const userId = idByHandle.get(handle);
      if (!userId) continue;
      await prisma.like.upsert({
        where: { postId_userId: { postId: p.id, userId } },
        update: {},
        create: { postId: p.id, userId },
      });
    }

    // Comments: deterministic ids (<postId>-c<idx>) keep reruns safe.
    for (let c = 0; c < p.comments.length; c++) {
      const cm = p.comments[c];
      const commentAuthorId = idByHandle.get(cm.user) ?? fallbackId(c);
      const commentId = `${p.id}-c${c}`;
      await prisma.comment.upsert({
        where: { id: commentId },
        update: { body: cm.text, authorId: commentAuthorId },
        create: {
          id: commentId,
          postId: p.id,
          authorId: commentAuthorId,
          body: cm.text,
        },
      });
    }
  }

  // 3. Study spots — mock `active`/`gradient` are UI-only, not in schema.
  for (const sp of spots) {
    await prisma.studySpot.upsert({
      where: { id: sp.id },
      update: {
        name: sp.name,
        building: sp.building,
        capacity: sp.capacity,
        occupancy: sp.occupancy,
        quietness: sp.quietness,
        openSeats: sp.openSeats,
        amenities: sp.amenities,
      },
      create: {
        id: sp.id,
        name: sp.name,
        building: sp.building,
        capacity: sp.capacity,
        occupancy: sp.occupancy,
        quietness: sp.quietness,
        openSeats: sp.openSeats,
        amenities: sp.amenities,
      },
    });
  }

  console.log(
    `seed ok: ${students.length} users, ${posts.length} posts, ${spots.length} spots`
  );
}

main()
  .catch((e) => {
    console.error("seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
