const BASE = 'http://localhost:8472/api/v1'
const API_KEY = process.env.TEST_API_KEY || ''
const HEADERS: Record<string, string> = { 'x-api-key': API_KEY }

let passed = 0
let failed = 0

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...HEADERS },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  return { status: res.status, ...data }
}

function check(label: string, condition: boolean) {
  if (condition) { passed++; console.log(`   PASS: ${label}`) }
  else { failed++; console.log(`   FAIL: ${label}`) }
}

async function testEvents() {
  console.log('\n=== Events API ===')
  const comm = await api('POST', '/communities', {
    code: `EVT-${Date.now()}`, name: 'Evt Community', location: 'Loc', contactPerson: 'Person',
  })
  check('Create community for event test', comm.success)
  const cid = comm.data?.id

  const create = await api('POST', '/events', { name: 'Test Event', communityId: cid, date: '2026-07-15T10:00:00Z' })
  check('Create event', create.success && create.data?.name === 'Test Event')
  const eid = create.data?.id

  const list = await api('GET', '/events')
  check('List events', list.success && list.data?.length > 0)

  const get = await api('GET', `/events/${eid}`)
  check('Get event by ID', get.success && get.data?.id === eid)

  const update = await api('PUT', `/events/${eid}`, { name: 'Updated Event' })
  check('Update event', update.success && update.data?.name === 'Updated Event')

  const notFound = await api('GET', '/events/00000000-0000-0000-0000-000000000000')
  check('Get non-existent event → 404', notFound.status === 404)

  const del = await api('DELETE', `/events/${eid}`)
  check('Delete event', del.success)

  await api('DELETE', `/communities/${cid}`)
  return { eventId: eid, communityId: cid }
}

async function testCommunities() {
  console.log('\n=== Communities API ===')
  const create = await api('POST', '/communities', {
    code: `COM-${Date.now()}`, name: 'Test Community', location: 'Test Location', contactPerson: 'Test Person',
  })
  check('Create community', create.success)
  const id = create.data?.id

  const list = await api('GET', '/communities')
  check('List communities', list.success && list.data?.length > 0)

  const get = await api('GET', `/communities/${id}`)
  check('Get community', get.success && get.data?.id === id)

  const update = await api('PUT', `/communities/${id}`, { name: 'Updated Community' })
  check('Update community', update.success && update.data?.name === 'Updated Community')

  const del = await api('DELETE', `/communities/${id}`)
  check('Delete community', del.success)
}

async function testStalls() {
  console.log('\n=== Stalls API ===')
  const create = await api('POST', '/stalls', { name: 'Test Stall', metrics: ['Accuracy', 'Speed'] })
  check('Create stall', create.success && create.data?.name === 'Test Stall')
  const id = create.data?.id

  const list = await api('GET', '/stalls')
  check('List stalls', list.success && list.data?.length > 0)

  const get = await api('GET', `/stalls/${id}`)
  check('Get stall', get.success && get.data?.id === id)

  const update = await api('PUT', `/stalls/${id}`, { name: 'Updated Stall' })
  check('Update stall', update.success && update.data?.name === 'Updated Stall')

  const del = await api('DELETE', `/stalls/${id}`)
  check('Delete stall', del.success)
}

async function testVolunteers() {
  console.log('\n=== Volunteers API ===')
  const create = await api('POST', '/volunteers', {
    name: 'Test Volunteer', email: `vol-${Date.now()}@test.com`, password: 'TestPass123!',
  })
  check('Create volunteer', create.success && create.data?.name === 'Test Volunteer')
  check('Password not in response', !create.data?.password)
  const id = create.data?.id

  const list = await api('GET', '/volunteers')
  check('List volunteers', list.success && list.data?.length > 0)
  check('Password not in list', !list.data?.[0]?.password)

  const get = await api('GET', `/volunteers/${id}`)
  check('Get volunteer', get.success && get.data?.id === id)
  check('Password not in get', !get.data?.password)

  const update = await api('PUT', `/volunteers/${id}`, { name: 'Updated Volunteer' })
  check('Update volunteer', update.success && update.data?.name === 'Updated Volunteer')

  const del = await api('DELETE', `/volunteers/${id}`)
  check('Delete volunteer', del.success)
}

async function testUsers() {
  console.log('\n=== Users API ===')
  const create = await api('POST', '/users', {
    name: 'Test User', email: `user-${Date.now()}@test.com`, password: 'TestPass123!', role: 'MANAGER',
  })
  check('Create user', create.success && create.data?.name === 'Test User')
  check('Password not in response', !create.data?.password)
  const id = create.data?.id

  const list = await api('GET', '/users')
  check('List users', list.success && list.data?.length > 0)
  check('Password not in list', !list.data?.[0]?.password)

  const get = await api('GET', `/users/${id}`)
  check('Get user', get.success && get.data?.id === id)

  const update = await api('PUT', `/users/${id}`, { name: 'Updated User' })
  check('Update user', update.success && update.data?.name === 'Updated User')

  const del = await api('DELETE', `/users/${id}`)
  check('Delete user', del.success)
}

async function testRegistrations() {
  console.log('\n=== Registrations API ===')

  // Setup: community + event + student
  const comm = await api('POST', '/communities', {
    code: `REG-${Date.now()}`, name: 'Reg Community', location: 'Loc', contactPerson: 'Person',
  })
  const event = await api('POST', '/events', { name: 'Reg Event', communityId: comm.data?.id, date: '2026-07-15T10:00:00Z' })
  const eventId = event.data?.id

  // Test: Create registration with new student
  const create = await api('POST', '/registrations', {
    eventId,
    name: 'Test Student',
    grade: '5',
    phoneNumber: '+919876543210',
    parentName: 'Test Parent',
  })
  check('Create registration', create.success && create.data?.registrationCode)
  check('QR token generated', !!create.data?.qrToken)
  check('Student created', !!create.data?.student?.rollNumber)
  const regId = create.data?.id

  // Test: List registrations
  const list = await api('GET', '/registrations')
  check('List registrations', list.success && list.data?.length > 0)

  // Test: Get registration
  const get = await api('GET', `/registrations/${regId}`)
  check('Get registration', get.success && get.data?.id === regId)
  check('Includes student', !!get.data?.student)
  check('Includes event', !!get.data?.event)

  // Test: Update registration
  const update = await api('PUT', `/registrations/${regId}`, { status: 'COMPLETED' })
  check('Update registration', update.success && update.data?.status === 'COMPLETED')

  // Test: Second registration for same event
  const create2 = await api('POST', '/registrations', {
    eventId,
    name: 'Another Student',
    grade: '3',
    phoneNumber: '+919876543212',
    parentName: 'Another Parent',
  })
  check('Second registration for same event', create2.success)

  // Test: Delete registration
  const del = await api('DELETE', `/registrations/${regId}`)
  check('Delete registration', del.success)

  // Cleanup
  await api('DELETE', `/events/${eventId}`)
  await api('DELETE', `/communities/${comm.data?.id}`)
}

async function testStudents() {
  console.log('\n=== Students API ===')

  // Create a student via registration
  const comm = await api('POST', '/communities', {
    code: `STU-${Date.now()}`, name: 'Stu Community', location: 'Loc', contactPerson: 'Person',
  })
  const event = await api('POST', '/events', { name: 'Stu Event', communityId: comm.data?.id, date: '2026-07-15T10:00:00Z' })
  const reg = await api('POST', '/registrations', {
    eventId: event.data?.id, name: 'Student Test', grade: '5', phoneNumber: '+919876543210', parentName: 'Parent',
  })
  const studentId = reg.data?.student?.id

  const list = await api('GET', '/students')
  check('List students', list.success && list.data?.length > 0)

  const get = await api('GET', `/students/${studentId}`)
  check('Get student', get.success && get.data?.id === studentId)
  check('Student includes registrations', !!get.data?.registrations)

  const update = await api('PUT', `/students/${studentId}`, { name: 'Updated Student' })
  check('Update student', update.success && update.data?.name === 'Updated Student')

  // Cleanup
  await api('DELETE', `/registrations/${reg.data?.id}`)
  await api('DELETE', `/events/${event.data?.id}`)
  await api('DELETE', `/communities/${comm.data?.id}`)
}

async function testStallVisits() {
  console.log('\n=== Stall Visits API ===')

  // Setup
  const comm = await api('POST', '/communities', { code: `SV-${Date.now()}`, name: 'SV Community', location: 'Loc', contactPerson: 'Person' })
  const event = await api('POST', '/events', { name: 'SV Event', communityId: comm.data?.id, date: '2026-07-15T10:00:00Z' })
  const stall = await api('POST', '/stalls', { name: 'SV Stall' })
  const reg = await api('POST', '/registrations', { eventId: event.data?.id, name: 'SV Student', grade: '5', phoneNumber: '+919876543210', parentName: 'Parent' })
  const studentId = reg.data?.student?.id

  const create = await api('POST', '/stall-visits', { registrationId: reg.data?.id, stallId: stall.data?.id, studentId })
  check('Create stall visit', create.success)

  const list = await api('GET', '/stall-visits')
  check('List stall visits', list.success && list.data?.length > 0)

  const get = await api('GET', `/stall-visits/${create.data?.id}`)
  check('Get stall visit', get.success && get.data?.id === create.data?.id)

  // Cleanup
  await api('DELETE', `/registrations/${reg.data?.id}`)
  await api('DELETE', `/events/${event.data?.id}`)
  await api('DELETE', `/communities/${comm.data?.id}`)
  await api('DELETE', `/stalls/${stall.data?.id}`)
}

async function testPerformances() {
  console.log('\n=== Performances API ===')

  // Setup
  const comm = await api('POST', '/communities', { code: `PF-${Date.now()}`, name: 'PF Community', location: 'Loc', contactPerson: 'Person' })
  const event = await api('POST', '/events', { name: 'PF Event', communityId: comm.data?.id, date: '2026-07-15T10:00:00Z' })
  const stall = await api('POST', '/stalls', { name: 'PF Stall' })
  const vol = await api('POST', '/volunteers', { name: 'PF Vol', email: `pf-${Date.now()}@test.com`, password: 'TestPass123!' })
  const reg = await api('POST', '/registrations', { eventId: event.data?.id, name: 'PF Student', grade: '5', phoneNumber: '+919876543210', parentName: 'Parent' })
  const studentId = reg.data?.student?.id
  const sv = await api('POST', '/stall-visits', { registrationId: reg.data?.id, stallId: stall.data?.id, studentId })

  const create = await api('POST', '/performances', {
    stallVisitId: sv.data?.id, volunteerId: vol.data?.id, score: 8.5, grade: 'A',
    creativity: 4, problemSolving: 5, communication: 3, learningAbility: 4,
  })
  check('Create performance', create.success && create.data?.score === 8.5)

  const list = await api('GET', '/performances')
  check('List performances', list.success && list.data?.length > 0)

  const get = await api('GET', `/performances/${create.data?.id}`)
  check('Get performance', get.success && get.data?.id === create.data?.id)

  // Cleanup
  await api('DELETE', `/registrations/${reg.data?.id}`)
  await api('DELETE', `/events/${event.data?.id}`)
  await api('DELETE', `/communities/${comm.data?.id}`)
  await api('DELETE', `/stalls/${stall.data?.id}`)
  await api('DELETE', `/volunteers/${vol.data?.id}`)
}

async function testAnalytics() {
  console.log('\n=== Analytics API ===')

  const overview = await api('GET', '/analytics/overview')
  check('Analytics overview', overview.success && overview.data?.stats)

  const communities = await api('GET', '/analytics/communities')
  check('Analytics communities', communities.success)

  const stalls = await api('GET', '/analytics/stalls')
  check('Analytics stalls', stalls.success)

  const volunteers = await api('GET', '/analytics/volunteers')
  check('Analytics volunteers', volunteers.success)
}

async function testApiKeys() {
  console.log('\n=== API Keys API ===')

  const list = await api('GET', '/api-keys')
  check('List API keys', list.success && list.data?.length > 0)
  check('Keys are masked', list.data?.[0]?.keyPreview?.includes('...'))

  const create = await api('POST', '/api-keys', { name: 'Test Key' })
  check('Create API key', create.success && create.data?.key)
  const keyId = create.data?.id

  const revoke = await api('DELETE', `/api-keys/${keyId}`)
  check('Revoke API key', revoke.success)
}

async function testAuth() {
  console.log('\n=== Authentication ===')
  const noKey = await fetch(`${BASE}/events`)
  check('Missing API key → 401', noKey.status === 401)

  const badKey = await fetch(`${BASE}/events`, { headers: { 'x-api-key': 'invalid-key' } })
  check('Invalid API key → 401', badKey.status === 401)
}

async function test() {
  console.log('\n========================================')
  console.log('  Phase 1 + Phase 2 API Tests')
  console.log('========================================')

  await testAuth()
  await testCommunities()
  await testEvents()
  await testStalls()
  await testVolunteers()
  await testUsers()
  await testRegistrations()
  await testStudents()
  await testStallVisits()
  await testPerformances()
  await testAnalytics()
  await testApiKeys()

  console.log('\n========================================')
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log('========================================\n')

  process.exit(failed > 0 ? 1 : 0)
}

test().catch(console.error)
