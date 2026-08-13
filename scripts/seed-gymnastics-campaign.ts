import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const c = await prisma.campaign.create({
    data: {
      name: 'Gymnastics Campaign',
      contentSid: 'HXd909c058fd34a420b04a87e8c44e15ba',
      status: 'DRAFT'
    }
  })
  console.log('Created campaign:', c.id)
}
main().catch(console.error).finally(async () => {
  // @ts-ignore
  await prisma.$disconnect()
})
