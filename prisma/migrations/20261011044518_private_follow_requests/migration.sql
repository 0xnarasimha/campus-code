-- AlterTable
ALTER TABLE "Follow" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT true;

-- Backfill: every Follow row predates statuses, so all were effective
-- follows. New rows default to pending; only this UPDATE makes old rows
-- accepted. Must stay in this migration (fresh DBs apply it when empty,
-- so it is a no-op there but load-bearing for existing DBs).
UPDATE "Follow" SET "status" = 'accepted' WHERE "status" = 'pending';
