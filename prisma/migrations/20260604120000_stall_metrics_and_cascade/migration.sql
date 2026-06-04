-- AlterTable: add per-stall metrics configuration
ALTER TABLE "stalls" ADD COLUMN "metrics" JSONB;

-- AlterTable: add per-evaluation metric star ratings
ALTER TABLE "performances" ADD COLUMN "metricScores" JSONB;

-- DropForeignKey: allow cascade deletion of stall assignments when stall is deleted
ALTER TABLE "volunteer_assignments" DROP CONSTRAINT "volunteer_assignments_stallId_fkey";
ALTER TABLE "volunteer_assignments" ADD CONSTRAINT "volunteer_assignments_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "stalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey: allow cascade deletion of stall visits when stall is deleted
ALTER TABLE "stall_visits" DROP CONSTRAINT "stall_visits_stallId_fkey";
ALTER TABLE "stall_visits" ADD CONSTRAINT "stall_visits_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "stalls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
