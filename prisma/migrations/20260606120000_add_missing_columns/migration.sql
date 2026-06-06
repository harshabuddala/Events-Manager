-- Add missing columns that were added to schema but not via migration

-- 1. isPublicRegistrationEnabled on events (boolean, default true)
ALTER TABLE "events" ADD COLUMN "isPublicRegistrationEnabled" BOOLEAN DEFAULT true;

-- 2. registeredBy on registrations (text, default 'PUBLIC')
ALTER TABLE "registrations" ADD COLUMN "registeredBy" TEXT DEFAULT 'PUBLIC';
