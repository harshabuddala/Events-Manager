-- AlterTable
ALTER TABLE "whatsapp_config" ADD COLUMN     "autoSendOnRegistration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationMessageTemplate" TEXT;
