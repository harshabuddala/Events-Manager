-- AlterTable
ALTER TABLE "events" ADD COLUMN     "letterheadId" TEXT;

-- CreateTable
CREATE TABLE "letterheads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "sizeBytes" INTEGER NOT NULL,
    "cropX" INTEGER NOT NULL,
    "cropY" INTEGER NOT NULL,
    "cropW" INTEGER NOT NULL,
    "cropH" INTEGER NOT NULL,
    "imageW" INTEGER NOT NULL,
    "imageH" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letterheads_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_letterheadId_fkey" FOREIGN KEY ("letterheadId") REFERENCES "letterheads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
