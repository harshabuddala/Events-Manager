/*
  Warnings:

  - You are about to drop the column `letterheadId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `letterheads` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_cards` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_letterheadId_fkey";

-- DropForeignKey
ALTER TABLE "report_cards" DROP CONSTRAINT "report_cards_studentId_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "letterheadId";

-- DropTable
DROP TABLE "letterheads";

-- DropTable
DROP TABLE "report_cards";

-- DropEnum
DROP TYPE "ReportStatus";
