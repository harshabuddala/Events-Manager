import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const c = await prisma.campaign.create({
    data: {
      name: 'Default Campaign',
      contentSid: 'HX722ded19eef957c39d4a4b110f1e8bcd',
      status: 'DRAFT'
    }
  })
  console.log('Created campaign:', c)
}
main().catch(console.error).finally(async () => {
  // @ts-ignore
  await prisma.$disconnect()
})
