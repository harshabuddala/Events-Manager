import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  await prisma.campaign.updateMany({
    data: {
      contentSid: 'HXd909c058fd34a420b04a87e8c44e15ba'
    }
  })
  console.log('Updated all campaigns with the latest template ID.')
}
main().catch(console.error).finally(async () => {
  // @ts-ignore
  await prisma.$disconnect()
})
