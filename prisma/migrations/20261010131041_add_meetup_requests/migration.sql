-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "meetupRequestId" TEXT;

-- CreateTable
CREATE TABLE "MeetupRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetupRequest_requesterId_idx" ON "MeetupRequest"("requesterId");

-- CreateIndex
CREATE INDEX "MeetupRequest_recipientId_idx" ON "MeetupRequest"("recipientId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_meetupRequestId_fkey" FOREIGN KEY ("meetupRequestId") REFERENCES "MeetupRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetupRequest" ADD CONSTRAINT "MeetupRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetupRequest" ADD CONSTRAINT "MeetupRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
