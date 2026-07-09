-- CreateTable
CREATE TABLE "razorpay_config" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "keySecret" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_config_pkey" PRIMARY KEY ("id")
);
