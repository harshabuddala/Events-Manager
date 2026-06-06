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

  // Create/Upsert Communities
  const communityData = [
    {
      code: 'C-001',
      name: 'Greenfield Society',
      location: 'Whitefield, Zone 1',
      zone: 'Zone 1',
      status: 'ACTIVE' as const,
      contactPerson: 'Rahul Sharma',
      contactEmail: 'rahul@greenfield.com',
      contactPhone: '+91 98765 43201',
    },
    {
      code: 'C-002',
      name: 'Sunrise Apartments',
      location: 'Indiranagar, Zone 2',
      zone: 'Zone 2',
      status: 'ACTIVE' as const,
      contactPerson: 'Priya Patel',
      contactEmail: 'priya@sunrise.com',
      contactPhone: '+91 98765 43202',
    },
    {
      code: 'C-003',
      name: 'Maple Residency',
      location: 'Koramangala, Zone 3',
      zone: 'Zone 3',
      status: 'UPCOMING' as const,
      contactPerson: 'Amit Kumar',
      contactEmail: 'amit@maple.com',
      contactPhone: '+91 98765 43203',
    },
    {
      code: 'C-004',
      name: 'Dream Valley',
      location: 'HSR Layout, Zone 2',
      zone: 'Zone 2',
      status: 'ACTIVE' as const,
      contactPerson: 'Sneha Reddy',
      contactEmail: 'sneha@dreamvalley.com',
      contactPhone: '+91 98765 43204',
    },
    {
      code: 'C-005',
      name: 'Lakeview Enclave',
      location: 'Electronic City, Zone 4',
      zone: 'Zone 4',
      status: 'INACTIVE' as const,
      contactPerson: 'Vikram Singh',
      contactEmail: 'vikram@lakeview.com',
      contactPhone: '+91 98765 43205',
    },
  ]

  const communities = await Promise.all(
    communityData.map(c =>
      prisma.community.upsert({
        where: { code: c.code },
        update: c,
        create: c,
      })
    )
  )
  console.log('Created/Upserted communities')

  // Create/Upsert Events
  const eventData = [
    {
      code: 'E-1284',
      name: 'Greenfield Science Fest',
      communityId: communities[0].id,
      organizerId: admin.id,
      date: new Date('2026-05-26'),
      endDate: new Date('2026-05-26'),
      status: 'LIVE' as const,
    },
    {
      code: 'E-1283',
      name: 'Sunrise Math Quest',
      communityId: communities[1].id,
      organizerId: admin.id,
      date: new Date('2026-05-25'),
      endDate: new Date('2026-05-25'),
      status: 'COMPLETED' as const,
    },
    {
      code: 'E-1285',
      name: 'Maple Learning Carnival',
      communityId: communities[2].id,
      organizerId: admin.id,
      date: new Date('2026-05-28'),
      endDate: new Date('2026-05-28'),
      status: 'UPCOMING' as const,
    },
    {
      code: 'E-1282',
      name: 'Dream Valley Brain Games',
      communityId: communities[3].id,
      organizerId: admin.id,
      date: new Date('2026-05-22'),
      endDate: new Date('2026-05-22'),
      status: 'COMPLETED' as const,
    },
    {
      code: 'E-1286',
      name: 'Lakeview Tech Day',
      communityId: communities[4].id,
      organizerId: admin.id,
      date: new Date('2026-06-02'),
      endDate: new Date('2026-06-02'),
      status: 'UPCOMING' as const,
    },
  ]

  const events = await Promise.all(
    eventData.map(e =>
      prisma.event.upsert({
        where: { code: e.code },
        update: e,
        create: e,
      })
    )
  )
  console.log('Created/Upserted events')

  // Create/Upsert Students
  const studentData = [
    {
      rollNumber: 'EDN784512',
      name: 'Aarav Sharma',
      grade: '5th Class',
      email: 'aarav@example.com',
      parentName: 'Rajesh Sharma',
      parentEmail: 'rajesh@example.com',
      parentPhone: '+91 98765 43211',
    },
    {
      rollNumber: 'EDN784513',
      name: 'Neha Gupta',
      grade: '3rd Class',
      email: 'neha@example.com',
      parentName: 'Suresh Gupta',
      parentEmail: 'suresh@example.com',
      parentPhone: '+91 98765 43212',
    },
    {
      rollNumber: 'EDN784514',
      name: 'Vihaan Singh',
      grade: '7th Class',
      email: 'vihaan@example.com',
      parentName: 'Manpreet Singh',
      parentEmail: 'manpreet@example.com',
      parentPhone: '+91 98765 43213',
    },
    {
      rollNumber: 'EDN784515',
      name: 'Ananya Patel',
      grade: '2nd Class',
      email: 'ananya@example.com',
      parentName: 'Ketan Patel',
      parentEmail: 'ketan@example.com',
      parentPhone: '+91 98765 43214',
    },
    {
      rollNumber: 'EDN784516',
      name: 'Rohan Kumar',
      grade: '8th Class',
      email: 'rohan@example.com',
      parentName: 'Vijay Kumar',
      parentEmail: 'vijay@example.com',
      parentPhone: '+91 98765 43215',
    },
    {
      rollNumber: 'EDN784517',
      name: 'Kavya Reddy',
      grade: '6th Class',
      email: 'kavya@example.com',
      parentName: 'Ramesh Reddy',
      parentEmail: 'ramesh@example.com',
      parentPhone: '+91 98765 43216',
    },
    {
      rollNumber: 'EDN784518',
      name: 'Ishaan Verma',
      grade: '4th Class',
      email: 'ishaan@example.com',
      parentName: 'Deepak Verma',
      parentEmail: 'deepak@example.com',
      parentPhone: '+91 98765 43217',
    },
  ]

  const students = await Promise.all(
    studentData.map(s =>
      prisma.student.upsert({
        where: { rollNumber: s.rollNumber },
        update: s,
        create: s,
      })
    )
  )
  console.log('Created/Upserted students')

  // Hash default volunteer password
  const defaultVolunteerPassword = await hash('Volunteer@123', 12)

  // Create/Upsert Volunteers
  const volunteerData = [
    {
      name: 'Anjali Desai',
      email: 'anjali.d@example.com',
      password: defaultVolunteerPassword,
      phoneNumber: '+91 98765 43210',
      role: 'LEAD_EVALUATOR' as const,
      preferredStall: 'Math Quest',
      rating: 4.9,
      totalEvents: 12,
      status: 'ASSIGNED' as const,
    },
    {
      name: 'Rahul Verma',
      email: 'rahul.v@example.com',
      password: defaultVolunteerPassword,
      phoneNumber: '+91 98765 43211',
      role: 'VOLUNTEER' as const,
      preferredStall: 'Science Lab',
      rating: 4.7,
      totalEvents: 8,
      status: 'AVAILABLE' as const,
    },
    {
      name: 'Priya Iyer',
      email: 'priya.i@example.com',
      password: defaultVolunteerPassword,
      phoneNumber: '+91 98765 43212',
      role: 'LEAD_EVALUATOR' as const,
      preferredStall: 'English Arena',
      rating: 4.8,
      totalEvents: 15,
      status: 'ASSIGNED' as const,
    },
    {
      name: 'Karan Singh',
      email: 'karan.s@example.com',
      password: defaultVolunteerPassword,
      phoneNumber: '+91 98765 43213',
      role: 'VOLUNTEER' as const,
      preferredStall: 'Logical Challenge',
      rating: 4.5,
      totalEvents: 5,
      status: 'AVAILABLE' as const,
    },
    {
      name: 'Neha Sharma',
      email: 'neha.s@example.com',
      password: defaultVolunteerPassword,
      phoneNumber: '+91 98765 43214',
      role: 'LEAD_EVALUATOR' as const,
      preferredStall: 'Creative Corner',
      rating: 4.9,
      totalEvents: 9,
      status: 'ON_LEAVE' as const,
    },
  ]

  const volunteers = await Promise.all(
    volunteerData.map(v =>
      prisma.volunteer.upsert({
        where: { email: v.email },
        update: v,
        create: v,
      })
    )
  )
  console.log('Created/Upserted volunteers')

  // Create/Upsert Stalls for the first event (Greenfield Science Fest)
  const stallData = [
    {
      code: 'ST-001',
      name: 'Math Quest',
      description: 'Mathematical puzzles and challenges',
      icon: 'Calculator',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Problem Solving', 'Calculation', 'Logical Thinking', 'Speed'],
    },
    {
      code: 'ST-002',
      name: 'Science Lab',
      description: 'Science experiments and discoveries',
      icon: 'Activity',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Curiosity', 'Observation', 'Hypothesis', 'Execution'],
    },
    {
      code: 'ST-003',
      name: 'English Arena',
      description: 'Language and communication skills',
      icon: 'BookOpen',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Vocabulary', 'Comprehension', 'Communication', 'Confidence'],
    },
    {
      code: 'ST-004',
      name: 'Logical Challenge',
      description: 'Logic and reasoning puzzles',
      icon: 'BrainCircuit',
      maxVolunteers: 5,
      status: 'ACTIVE' as const,
      metrics: ['Reasoning', 'Pattern Recognition', 'Strategy', 'Focus'],
    },
    {
      code: 'ST-005',
      name: 'Creative Corner',
      description: 'Arts and creative expression',
      icon: 'Palette',
      maxVolunteers: 5,
      status: 'MAINTENANCE' as const,
    },
  ]

  const stalls = await Promise.all(
    stallData.map(s =>
      prisma.stall.upsert({
        where: { code: s.code },
        update: {
          ...s,
          events: { connect: [{ id: events[0].id }] },
        },
        create: {
          ...s,
          events: { connect: [{ id: events[0].id }] },
        },
      })
    )
  )
  console.log('Created/Upserted stalls')

  // Create/Upsert Registrations
  const registrationData = [
    {
      registrationCode: 'REG-8451',
      qrToken: generateQrToken(),
      eventId: events[0].id,
      studentId: students[0].id,
      status: 'COMPLETED' as const,
      completedAt: new Date('2026-05-26'),
    },
    {
      registrationCode: 'REG-8452',
      qrToken: generateQrToken(),
      eventId: events[0].id,
      studentId: students[1].id,
      status: 'IN_PROGRESS' as const,
    },
    {
      registrationCode: 'REG-8453',
      qrToken: generateQrToken(),
      eventId: events[1].id,
      studentId: students[2].id,
      status: 'COMPLETED' as const,
      completedAt: new Date('2026-05-25'),
    },
    {
      registrationCode: 'REG-8454',
      qrToken: generateQrToken(),
      eventId: events[2].id,
      studentId: students[3].id,
      status: 'REGISTERED' as const,
    },
    {
      registrationCode: 'REG-8455',
      qrToken: generateQrToken(),
      eventId: events[3].id,
      studentId: students[4].id,
      status: 'COMPLETED' as const,
      completedAt: new Date('2026-05-22'),
    },
  ]

  const registrations = await Promise.all(
    registrationData.map(r =>
      prisma.registration.upsert({
        where: { registrationCode: r.registrationCode },
        update: r,
        create: r,
      })
    )
  )
  console.log('Created/Upserted registrations')

  // Create/Upsert Volunteer Assignments
  const assignmentData = [
    {
      eventId: events[0].id,
      stallId: stalls[0].id,
      volunteerId: volunteers[0].id,
    },
    {
      eventId: events[0].id,
      stallId: stalls[1].id,
      volunteerId: volunteers[1].id,
    },
    {
      eventId: events[0].id,
      stallId: stalls[2].id,
      volunteerId: volunteers[2].id,
    },
  ]

  await Promise.all(
    assignmentData.map(a =>
      prisma.volunteerAssignment.upsert({
        where: {
          eventId_stallId_volunteerId: {
            eventId: a.eventId,
            stallId: a.stallId,
            volunteerId: a.volunteerId,
          },
        },
        update: a,
        create: a,
      })
    )
  )
  console.log('Created/Upserted volunteer assignments')

  // Create/Upsert Stall Visits
  const stallVisitData = [
    {
      registrationId: registrations[0].id,
      stallId: stalls[0].id,
      studentId: students[0].id,
      completedAt: new Date('2026-05-26'),
    },
    {
      registrationId: registrations[0].id,
      stallId: stalls[1].id,
      studentId: students[0].id,
      completedAt: new Date('2026-05-26'),
    },
    {
      registrationId: registrations[1].id,
      stallId: stalls[0].id,
      studentId: students[1].id,
    },
  ]

  const stallVisits = await Promise.all(
    stallVisitData.map(v =>
      prisma.stallVisit.upsert({
        where: {
          registrationId_stallId: {
            registrationId: v.registrationId,
            stallId: v.stallId,
          },
        },
        update: v,
        create: v,
      })
    )
  )
  console.log('Created/Upserted stall visits')

  // Create/Upsert Performances
  const performanceData = [
    {
      stallVisitId: stallVisits[0].id,
      volunteerId: volunteers[0].id,
      score: 9.2,
      grade: 'A+',
      remarks: 'Excellent problem-solving skills',
      participation: 1,
      creativity: 9,
      problemSolving: 10,
      communication: 8,
      learningAbility: 9,
    },
    {
      stallVisitId: stallVisits[1].id,
      volunteerId: volunteers[1].id,
      score: 8.8,
      grade: 'A',
      remarks: 'Good understanding of concepts',
      participation: 1,
      creativity: 8,
      problemSolving: 9,
      communication: 8,
      learningAbility: 9,
    },
  ]

  await Promise.all(
    performanceData.map(p =>
      prisma.performance.upsert({
        where: { stallVisitId: p.stallVisitId },
        update: p,
        create: p,
      })
    )
  )
  console.log('Created/Upserted performances')

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
