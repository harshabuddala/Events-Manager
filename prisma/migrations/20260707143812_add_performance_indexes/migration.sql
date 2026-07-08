/*
  Warnings:

  - Made the column `isPublicRegistrationEnabled` on table `events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `registeredBy` on table `registrations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "events" ALTER COLUMN "isPublicRegistrationEnabled" SET NOT NULL;

-- AlterTable
ALTER TABLE "registrations" ALTER COLUMN "registeredBy" SET NOT NULL;

-- CreateIndex
CREATE INDEX "performances_volunteerId_idx" ON "performances"("volunteerId");

-- CreateIndex
CREATE INDEX "performances_createdAt_idx" ON "performances"("createdAt");

-- CreateIndex
CREATE INDEX "registrations_eventId_idx" ON "registrations"("eventId");

-- CreateIndex
CREATE INDEX "registrations_studentId_idx" ON "registrations"("studentId");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "registrations"("status");

-- CreateIndex
CREATE INDEX "stall_visits_registrationId_idx" ON "stall_visits"("registrationId");

-- CreateIndex
CREATE INDEX "stall_visits_studentId_idx" ON "stall_visits"("studentId");

-- CreateIndex
CREATE INDEX "volunteers_status_idx" ON "volunteers"("status");
