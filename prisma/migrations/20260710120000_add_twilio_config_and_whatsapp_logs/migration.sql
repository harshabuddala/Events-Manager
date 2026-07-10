-- Migration: Add twilio_config table and whatsapp_logs table with MessageStatus enum
-- These tables were added to schema.prisma but never had a proper migration file.
-- This migration is safe: it only creates new tables/enums, no data is modified.

-- CreateEnum (only if not exists — idempotent)
DO $$ BEGIN
  CREATE TYPE "MessageStatus" AS ENUM ('SUCCESS', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable twilio_config (only if not exists)
CREATE TABLE IF NOT EXISTS "twilio_config" (
    "id" TEXT NOT NULL,
    "accountSid" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "whatsappFrom" TEXT NOT NULL,
    "contentSid" TEXT,
    "idCardContentSid" TEXT,
    "reportContentSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twilio_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable whatsapp_logs (only if not exists)
CREATE TABLE IF NOT EXISTS "whatsapp_logs" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL,
    "messageSid" TEXT,
    "errorMessage" TEXT,
    "eventId" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "whatsapp_logs_eventId_idx" ON "whatsapp_logs"("eventId");
CREATE INDEX IF NOT EXISTS "whatsapp_logs_status_idx" ON "whatsapp_logs"("status");
CREATE INDEX IF NOT EXISTS "whatsapp_logs_studentId_idx" ON "whatsapp_logs"("studentId");

-- AddForeignKey (only if not exists)
DO $$ BEGIN
  ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
