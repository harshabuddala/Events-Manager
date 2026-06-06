import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
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

  if (shouldClean) {
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
    console.log('Cleaned existing data')
  } else {
    const existingEvents = await prisma.event.count()
    if (existingEvents > 0) {
      console.log(`Database already has ${existingEvents} event(s). Skipping seed.`)
      console.log('To force re-seed, set SEED_CLEAN=true')
      return
    }
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

  const admin = await prisma.user.upsert({
    where: { email: 'admin@edunura.com' },
    update: {
      password: hashedAdminPassword,
    },
    create: {
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
