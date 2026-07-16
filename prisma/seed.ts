import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'
import { Pool } from 'pg'

// Inline so seed.ts is self-contained (Docker container path resolution)
function generateQrToken(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  const isProduction = process.env.NODE_ENV === 'production'
  const shouldClean = process.env.SEED_CLEAN === 'true'

  // WARNING: Cleaning deletes all application data. Only allowed in non-production
  // environments and only when explicitly requested via SEED_CLEAN=true.
  // The previous auto-detect logic that wiped data based on stall codes has been
  // removed because it destroyed production data on every deploy.
  if (shouldClean) {
    if (isProduction) {
      console.log('WARNING: SEED_CLEAN=true is not allowed in production. Skipping data cleanup.')
    } else {
      console.log('SEED_CLEAN=true: Cleaning existing data...')
      await prisma.performance.deleteMany()
      await prisma.stallVisit.deleteMany()
      await prisma.volunteerAssignment.deleteMany()
      await prisma.registration.deleteMany()
      await prisma.stall.deleteMany()
      await prisma.volunteer.deleteMany()
      await prisma.student.deleteMany()
      await prisma.event.deleteMany()
      await prisma.community.deleteMany()
      await prisma.user.deleteMany()
      await prisma.apiKey.deleteMany()
      console.log('Cleaned existing data')
    }
  }

  // If default stalls already exist, there is nothing more to seed.
  const hasNewStalls = await prisma.stall.findFirst({
    where: { code: { in: ['ST-MATHS', 'ST-SCIENCE', 'ST-FITNESS', 'ST-CREATIVE', 'ST-ENGLISH'] } },
  })

  if (hasNewStalls) {
    console.log('Default stalls already present. Skipping seed.')
    return
  }

  let adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    if (isProduction) {
      adminPassword = randomBytes(24).toString('base64')
      console.log('')
      console.log('========================================')
      console.log('  GENERATED ADMIN PASSWORD')
      console.log('  (save this immediately!)')
      console.log(`  ${adminPassword}`)
      console.log('========================================')
      console.log('')
    } else {
      adminPassword = 'admin123'
      console.log('WARNING: Using default admin password. Set ADMIN_PASSWORD env var for production.')
    }
  }

  const hashedAdminPassword = await hash(adminPassword, 12)

  // Use a fixed UUID for the admin so sessions survive re-seeds.
  const adminId = '00000000-0000-0000-0000-000000000001'

  const admin = await prisma.user.upsert({
    where: { email: 'admin@edunura.com' },
    update: {
      password: hashedAdminPassword,
    },
    create: {
      id: adminId,
      email: 'admin@edunura.com',
      password: hashedAdminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phoneNumber: '+91 98765 43200',
    },
  })

  console.log('Created/Upserted admin user')

  // ── Pre-defined stalls with metrics ───────────────────────────────────────
  const stallData = [
    {
      code: 'ST-MATHS',
      name: 'Maths Mania',
      description: 'Mathematical puzzles, challenges and problem-solving activities',
      icon: 'Calculator',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Accuracy', 'Problem solving skills', 'Completion time', 'Team Collaboration', 'Concept Mastery'],
    },
    {
      code: 'ST-SCIENCE',
      name: 'Science street',
      description: 'Science experiments, discoveries and hands-on learning',
      icon: 'Activity',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Accuracy', 'Speed', 'Scientific reasoning', 'Communication skills', 'Creativity'],
    },
    {
      code: 'ST-FITNESS',
      name: 'Fitness',
      description: 'Physical fitness, sports and wellness activities',
      icon: 'Dumbbell',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Flexibility', 'Strength', 'Endurance', 'Speed', 'Discipline'],
    },
    {
      code: 'ST-CREATIVE',
      name: 'Creative Corner',
      description: 'Arts, crafts and creative expression',
      icon: 'Palette',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Creativity', 'Design & Arrangement', 'Neatness', 'Theme Relevance', 'Time Management'],
    },
    {
      code: 'ST-ENGLISH',
      name: 'English Arena',
      description: 'Language, communication and presentation skills',
      icon: 'BookOpen',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Idea Generation', 'Communication', 'Confidence and stage presence', 'Leadership mind set', 'Teaching skills'],
    },
  ]

  const stalls = await Promise.all(
    stallData.map(s =>
      prisma.stall.upsert({
        where: { code: s.code },
        update: s,
        create: s,
      })
    )
  )
  console.log(`Created/Upserted ${stalls.length} stalls`)

  // ── Default API Key ──────────────────────────────────────────────────────
  const rawKey = randomBytes(32).toString('hex')
  const hashedKey = createHash('sha256').update(rawKey).digest('hex')

  const existingKey = await prisma.apiKey.findFirst({ where: { name: 'Default API Key' } })
  if (!existingKey) {
    await prisma.apiKey.create({
      data: { key: hashedKey, name: 'Default API Key', isActive: true },
    })
    console.log('')
    console.log('========================================')
    console.log('  DEFAULT API KEY')
    console.log('  (save this — shown only once!)')
    console.log(`  ${rawKey}`)
    console.log('========================================')
    console.log('')
  } else {
    console.log('Default API key already exists, skipping.')
  }

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
