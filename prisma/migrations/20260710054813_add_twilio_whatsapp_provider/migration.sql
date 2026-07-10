-- CreateEnum
CREATE TYPE "WhatsAppProvider" AS ENUM ('META', 'TWILIO');

-- AlterTable
ALTER TABLE "whatsapp_config" ADD COLUMN     "provider" "WhatsAppProvider" NOT NULL DEFAULT 'META',
ADD COLUMN     "twilioAccountSid" TEXT,
ADD COLUMN     "twilioAuthToken" TEXT,
ADD COLUMN     "twilioWhatsAppFrom" TEXT,
ALTER COLUMN "phoneNumberId" DROP NOT NULL,
ALTER COLUMN "accessToken" DROP NOT NULL;
