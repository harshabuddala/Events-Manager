/*
  Warnings:

  - You are about to drop the column `category` on the `stalls` table. All the data in the column will be lost.
  - You are about to drop the `StallCategory` enum. If the table is using the enum, this will fail.

*/
-- DropIndex (conditional, may not exist in some DB states)
DROP INDEX IF EXISTS "stalls_eventId_idx";

-- AlterTable
ALTER TABLE "stalls" DROP COLUMN IF EXISTS "category";

-- DropEnum (conditional, may not exist in some DB states)
DROP TYPE IF EXISTS "StallCategory";
