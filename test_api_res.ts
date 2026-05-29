import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const stalls = await prisma.stall.findMany({
    include: {
      _count: { select: { stallVisits: true, assignments: true, events: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  console.log(stalls);
}
main().then(()=>process.exit(0))
