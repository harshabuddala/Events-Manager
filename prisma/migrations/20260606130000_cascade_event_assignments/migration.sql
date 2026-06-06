-- Add ON DELETE CASCADE to volunteer_assignments.eventId foreign key
-- so deleting an event automatically removes its volunteer assignments.

-- 1. Drop the existing foreign key
ALTER TABLE "volunteer_assignments" 
  DROP CONSTRAINT IF EXISTS "volunteer_assignments_eventId_fkey";

-- 2. Re-create it with ON DELETE CASCADE
ALTER TABLE "volunteer_assignments" 
  ADD CONSTRAINT "volunteer_assignments_eventId_fkey" 
  FOREIGN KEY ("eventId") REFERENCES "events"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;
