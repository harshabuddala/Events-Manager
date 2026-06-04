-- DropForeignKey: allow cascade deletion of performances when their stall visit is deleted
ALTER TABLE "performances" DROP CONSTRAINT "performances_stallVisitId_fkey";
ALTER TABLE "performances" ADD CONSTRAINT "performances_stallVisitId_fkey" FOREIGN KEY ("stallVisitId") REFERENCES "stall_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
