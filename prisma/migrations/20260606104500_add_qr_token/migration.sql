-- AlterTable
ALTER TABLE "registrations" ADD COLUMN "qrToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "registrations_qrToken_key" ON "registrations"("qrToken");
