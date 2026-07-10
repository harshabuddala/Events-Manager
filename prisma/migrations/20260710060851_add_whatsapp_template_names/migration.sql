-- AlterTable
ALTER TABLE "whatsapp_config" ADD COLUMN     "metaRegistrationTemplateName" TEXT,
ADD COLUMN     "metaReportTemplateName" TEXT,
ADD COLUMN     "metaTemplateLanguage" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "twilioRegistrationContentSid" TEXT,
ADD COLUMN     "twilioReportContentSid" TEXT;
