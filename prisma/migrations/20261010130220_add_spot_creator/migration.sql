-- AlterTable
ALTER TABLE "StudySpot" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "StudySpot" ADD CONSTRAINT "StudySpot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
