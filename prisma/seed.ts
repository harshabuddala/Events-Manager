import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
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
    await prisma.reportCard.deleteMany()
    await prisma.registration.deleteMany()
    await prisma.stall.deleteMany()
    await prisma.volunteer.deleteMany()
    await prisma.student.deleteMany()
    await prisma.event.deleteMany()
    await prisma.community.deleteMany()
    await prisma.user.deleteMany()
    console.log('Cleaned existing data')
  } else {
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log(`Database already has ${existingUsers} user(s). Skipping seed.`)
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

  const admin = await prisma.user.create({
    data: {
      email: 'admin@edunura.com',
      password: hashedAdminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      phoneNumber: '+91 98765 43200',
    },
  })

  console.log('Created admin user')

  // Create Communities
  const communities = await Promise.all([
    prisma.community.create({
      data: {
        code: 'C-001',
        name: 'Greenfield Society',
        location: 'Whitefield, Zone 1',
        zone: 'Zone 1',
        status: 'ACTIVE',
        contactPerson: 'Rahul Sharma',
        contactEmail: 'rahul@greenfield.com',
        contactPhone: '+91 98765 43201',
      },
    }),
    prisma.community.create({
      data: {
        code: 'C-002',
        name: 'Sunrise Apartments',
        location: 'Indiranagar, Zone 2',
        zone: 'Zone 2',
        status: 'ACTIVE',
        contactPerson: 'Priya Patel',
        contactEmail: 'priya@sunrise.com',
        contactPhone: '+91 98765 43202',
      },
    }),
    prisma.community.create({
      data: {
        code: 'C-003',
        name: 'Maple Residency',
        location: 'Koramangala, Zone 3',
        zone: 'Zone 3',
        status: 'UPCOMING',
        contactPerson: 'Amit Kumar',
        contactEmail: 'amit@maple.com',
        contactPhone: '+91 98765 43203',
      },
    }),
    prisma.community.create({
      data: {
        code: 'C-004',
        name: 'Dream Valley',
        location: 'HSR Layout, Zone 2',
        zone: 'Zone 2',
        status: 'ACTIVE',
        contactPerson: 'Sneha Reddy',
        contactEmail: 'sneha@dreamvalley.com',
        contactPhone: '+91 98765 43204',
      },
    }),
    prisma.community.create({
      data: {
        code: 'C-005',
        name: 'Lakeview Enclave',
        location: 'Electronic City, Zone 4',
        zone: 'Zone 4',
        status: 'INACTIVE',
        contactPerson: 'Vikram Singh',
        contactEmail: 'vikram@lakeview.com',
        contactPhone: '+91 98765 43205',
      },
    }),
  ])

  console.log('Created communities')

  // Create Events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        code: 'E-1284',
        name: 'Greenfield Science Fest',
        communityId: communities[0].id,
        organizerId: admin.id,
        date: new Date('2026-05-26'),
        endDate: new Date('2026-05-26'),
        status: 'LIVE',
      },
    }),
    prisma.event.create({
      data: {
        code: 'E-1283',
        name: 'Sunrise Math Quest',
        communityId: communities[1].id,
        organizerId: admin.id,
        date: new Date('2026-05-25'),
        endDate: new Date('2026-05-25'),
        status: 'COMPLETED',
      },
    }),
    prisma.event.create({
      data: {
        code: 'E-1285',
        name: 'Maple Learning Carnival',
        communityId: communities[2].id,
        organizerId: admin.id,
        date: new Date('2026-05-28'),
        endDate: new Date('2026-05-28'),
        status: 'UPCOMING',
      },
    }),
    prisma.event.create({
      data: {
        code: 'E-1282',
        name: 'Dream Valley Brain Games',
        communityId: communities[3].id,
        organizerId: admin.id,
        date: new Date('2026-05-22'),
        endDate: new Date('2026-05-22'),
        status: 'COMPLETED',
      },
    }),
    prisma.event.create({
      data: {
        code: 'E-1286',
        name: 'Lakeview Tech Day',
        communityId: communities[4].id,
        organizerId: admin.id,
        date: new Date('2026-06-02'),
        endDate: new Date('2026-06-02'),
        status: 'UPCOMING',
      },
    }),
  ])

  console.log('Created events')

  // Create Students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        rollNumber: 'EDN784512',
        name: 'Aarav Sharma',
        grade: '5th Class',
        email: 'aarav@example.com',
        parentName: 'Rajesh Sharma',
        parentEmail: 'rajesh@example.com',
        parentPhone: '+91 98765 43211',
      },
    }),
    prisma.student.create({
      data: {
        rollNumber: 'EDN784513',
        name: 'Neha Gupta',
        grade: '3rd Class',
        email: 'neha@example.com',
        parentName: 'Suresh Gupta',
        parentEmail: 'suresh@example.com',
        parentPhone: '+91 98765 43212',
      },
    }),
    prisma.student.create({
      data: {
        rollNumber: 'EDN784514',
        name: 'Vihaan Singh',
        grade: '7th Class',
        email: 'vihaan@example.com',
        parentName: 'Manpreet Singh',
        parentEmail: 'manpreet@example.com',
        parentPhone: '+91 98765 43213',
      },
    }),
    prisma.student.create({
      data: {
        rollNumber: 'EDN784515',
        name: 'Ananya Patel',
        grade: '2nd Class',
        email: 'ananya@example.com',
        parentName: 'Ketan Patel',
        parentEmail: 'ketan@example.com',
        parentPhone: '+91 98765 43214',
      },
    }),
    prisma.student.create({
      data: {
        rollNumber: 'EDN784516',
        name: 'Rohan Kumar',
        grade: '8th Class',
        email: 'rohan@example.com',
        parentName: 'Vijay Kumar',
        parentEmail: 'vijay@example.com',
        parentPhone: '+91 98765 43215',
      },
    }),
    prisma.student.create({
      data: {
        rollNumber: 'EDN784517',
        name: 'Kavya Reddy',
        grade: '6th Class',
        email: 'kavya@example.com',
        parentName: 'Ramesh Reddy',
        parentEmail: 'ramesh@example.com',
        parentPhone: '+91 98765 43216',
      },
    }),
    prisma.student.create({
      data: {
        rollNumber: 'EDN784518',
        name: 'Ishaan Verma',
        grade: '4th Class',
        email: 'ishaan@example.com',
        parentName: 'Deepak Verma',
        parentEmail: 'deepak@example.com',
        parentPhone: '+91 98765 43217',
      },
    }),
  ])

  console.log('Created students')

  // Hash default volunteer password
  const defaultVolunteerPassword = await hash('Volunteer@123', 12)

  // Create Volunteers
  const volunteers = await Promise.all([
    prisma.volunteer.create({
      data: {
        name: 'Anjali Desai',
        email: 'anjali.d@example.com',
        password: defaultVolunteerPassword,
        phoneNumber: '+91 98765 43210',
        role: 'LEAD_EVALUATOR',
        preferredStall: 'Math Quest',
        rating: 4.9,
        totalEvents: 12,
        status: 'ASSIGNED',
      },
    }),
    prisma.volunteer.create({
      data: {
        name: 'Rahul Verma',
        email: 'rahul.v@example.com',
        password: defaultVolunteerPassword,
        phoneNumber: '+91 98765 43211',
        role: 'VOLUNTEER',
        preferredStall: 'Science Lab',
        rating: 4.7,
        totalEvents: 8,
        status: 'AVAILABLE',
      },
    }),
    prisma.volunteer.create({
      data: {
        name: 'Priya Iyer',
        email: 'priya.i@example.com',
        password: defaultVolunteerPassword,
        phoneNumber: '+91 98765 43212',
        role: 'LEAD_EVALUATOR',
        preferredStall: 'English Arena',
        rating: 4.8,
        totalEvents: 15,
        status: 'ASSIGNED',
      },
    }),
    prisma.volunteer.create({
      data: {
        name: 'Karan Singh',
        email: 'karan.s@example.com',
        password: defaultVolunteerPassword,
        phoneNumber: '+91 98765 43213',
        role: 'VOLUNTEER',
        preferredStall: 'Logical Challenge',
        rating: 4.5,
        totalEvents: 5,
        status: 'AVAILABLE',
      },
    }),
    prisma.volunteer.create({
      data: {
        name: 'Neha Sharma',
        email: 'neha.s@example.com',
        password: defaultVolunteerPassword,
        phoneNumber: '+91 98765 43214',
        role: 'LEAD_EVALUATOR',
        preferredStall: 'Creative Corner',
        rating: 4.9,
        totalEvents: 9,
        status: 'ON_LEAVE',
      },
    }),
  ])

  console.log('Created volunteers')

  // Create Stalls for the first event (Greenfield Science Fest)
  const stalls = await Promise.all([
    prisma.stall.create({
      data: {
        code: 'ST-001',
        events: { connect: [{ id: events[0].id }] },
        name: 'Math Quest',
        description: 'Mathematical puzzles and challenges',
        icon: 'Calculator',
        maxVolunteers: 5,
        status: 'ACTIVE',
        metrics: ['Problem Solving', 'Calculation', 'Logical Thinking', 'Speed'],
      },
    }),
    prisma.stall.create({
      data: {
        code: 'ST-002',
        events: { connect: [{ id: events[0].id }] },
        name: 'Science Lab',
        description: 'Science experiments and discoveries',
        icon: 'Activity',
        maxVolunteers: 5,
        status: 'ACTIVE',
        metrics: ['Curiosity', 'Observation', 'Hypothesis', 'Execution'],
      },
    }),
    prisma.stall.create({
      data: {
        code: 'ST-003',
        events: { connect: [{ id: events[0].id }] },
        name: 'English Arena',
        description: 'Language and communication skills',
        icon: 'BookOpen',
        maxVolunteers: 5,
        status: 'ACTIVE',
        metrics: ['Vocabulary', 'Comprehension', 'Communication', 'Confidence'],
      },
    }),
    prisma.stall.create({
      data: {
        code: 'ST-004',
        events: { connect: [{ id: events[0].id }] },
        name: 'Logical Challenge',
        description: 'Logic and reasoning puzzles',
        icon: 'BrainCircuit',
        maxVolunteers: 5,
        status: 'ACTIVE',
        metrics: ['Reasoning', 'Pattern Recognition', 'Strategy', 'Focus'],
      },
    }),
    prisma.stall.create({
      data: {
        code: 'ST-005',
        events: { connect: [{ id: events[0].id }] },
        name: 'Creative Corner',
        description: 'Arts and creative expression',
        icon: 'Palette',
        maxVolunteers: 5,
        status: 'MAINTENANCE',
      },
    }),
  ])

  console.log('Created stalls')

  // Create Registrations
  const registrations = await Promise.all([
    prisma.registration.create({
      data: {
        registrationCode: 'REG-8451',
        eventId: events[0].id,
        studentId: students[0].id,
        status: 'COMPLETED',
        completedAt: new Date('2026-05-26'),
      },
    }),
    prisma.registration.create({
      data: {
        registrationCode: 'REG-8452',
        eventId: events[0].id,
        studentId: students[1].id,
        status: 'IN_PROGRESS',
      },
    }),
    prisma.registration.create({
      data: {
        registrationCode: 'REG-8453',
        eventId: events[1].id,
        studentId: students[2].id,
        status: 'COMPLETED',
        completedAt: new Date('2026-05-25'),
      },
    }),
    prisma.registration.create({
      data: {
        registrationCode: 'REG-8454',
        eventId: events[2].id,
        studentId: students[3].id,
        status: 'REGISTERED',
      },
    }),
    prisma.registration.create({
      data: {
        registrationCode: 'REG-8455',
        eventId: events[3].id,
        studentId: students[4].id,
        status: 'COMPLETED',
        completedAt: new Date('2026-05-22'),
      },
    }),
  ])

  console.log('Created registrations')

  // Create Volunteer Assignments
  await Promise.all([
    prisma.volunteerAssignment.create({
      data: {
        eventId: events[0].id,
        stallId: stalls[0].id,
        volunteerId: volunteers[0].id,
      },
    }),
    prisma.volunteerAssignment.create({
      data: {
        eventId: events[0].id,
        stallId: stalls[1].id,
        volunteerId: volunteers[1].id,
      },
    }),
    prisma.volunteerAssignment.create({
      data: {
        eventId: events[0].id,
        stallId: stalls[2].id,
        volunteerId: volunteers[2].id,
      },
    }),
  ])

  console.log('Created volunteer assignments')

  // Create Stall Visits
  const stallVisits = await Promise.all([
    prisma.stallVisit.create({
      data: {
        registrationId: registrations[0].id,
        stallId: stalls[0].id,
        studentId: students[0].id,
        completedAt: new Date('2026-05-26'),
      },
    }),
    prisma.stallVisit.create({
      data: {
        registrationId: registrations[0].id,
        stallId: stalls[1].id,
        studentId: students[0].id,
        completedAt: new Date('2026-05-26'),
      },
    }),
    prisma.stallVisit.create({
      data: {
        registrationId: registrations[1].id,
        stallId: stalls[0].id,
        studentId: students[1].id,
      },
    }),
  ])

  console.log('Created stall visits')

  // Create Performances
  await Promise.all([
    prisma.performance.create({
      data: {
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
    }),
    prisma.performance.create({
      data: {
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
    }),
  ])

  console.log('Created performances')

  // Create Report Cards
  await Promise.all([
    prisma.reportCard.create({
      data: {
        reportCode: 'RC-9812',
        studentId: students[0].id,
        eventId: events[0].id,
        totalScore: 94,
        overallGrade: 'A+',
        topSkill: 'Mathematics (98%)',
        skillsAssessed: 5,
        status: 'GENERATED',
        generatedAt: new Date('2026-05-26'),
      },
    }),
    prisma.reportCard.create({
      data: {
        reportCode: 'RC-9813',
        studentId: students[2].id,
        eventId: events[1].id,
        totalScore: 88,
        overallGrade: 'A',
        topSkill: 'Science (95%)',
        skillsAssessed: 5,
        status: 'GENERATED',
        generatedAt: new Date('2026-05-25'),
      },
    }),
    prisma.reportCard.create({
      data: {
        reportCode: 'RC-9814',
        studentId: students[4].id,
        eventId: events[3].id,
        totalScore: 76,
        overallGrade: 'B+',
        topSkill: 'Arts (92%)',
        skillsAssessed: 4,
        status: 'GENERATED',
        generatedAt: new Date('2026-05-22'),
      },
    }),
    prisma.reportCard.create({
      data: {
        reportCode: 'RC-9815',
        studentId: students[6].id,
        totalScore: 91,
        overallGrade: 'A+',
        topSkill: 'Reasoning (94%)',
        skillsAssessed: 4,
        status: 'GENERATED',
        generatedAt: new Date('2026-05-20'),
      },
    }),
    prisma.reportCard.create({
      data: {
        reportCode: 'RC-9816',
        studentId: students[5].id,
        totalScore: 0,
        overallGrade: '-',
        skillsAssessed: 0,
        status: 'PENDING',
      },
    }),
  ])

  console.log('Created report cards')

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
