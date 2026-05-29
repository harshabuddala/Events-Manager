-- DropForeignKey
ALTER TABLE "stalls" DROP CONSTRAINT "stalls_eventId_fkey";

-- AlterTable
ALTER TABLE "stalls" ALTER COLUMN "eventId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "stalls" ADD CONSTRAINT "stalls_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
