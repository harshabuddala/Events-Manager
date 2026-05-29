/*
  Warnings:

  - You are about to drop the column `eventId` on the `stalls` table. All the data in the column will be lost.
  - Added the required column `password` to the `volunteers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "stalls" DROP CONSTRAINT "stalls_eventId_fkey";

-- AlterTable
ALTER TABLE "stalls" DROP COLUMN "eventId";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "age" INTEGER;

-- AlterTable
ALTER TABLE "volunteers" ADD COLUMN     "password" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_EventToStall" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventToStall_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventToStall_B_index" ON "_EventToStall"("B");

-- AddForeignKey
ALTER TABLE "_EventToStall" ADD CONSTRAINT "_EventToStall_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToStall" ADD CONSTRAINT "_EventToStall_B_fkey" FOREIGN KEY ("B") REFERENCES "stalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
