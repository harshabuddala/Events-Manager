import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const totalRegistrations = await prisma.registration.count()
    const totalCommunities = await prisma.community.count()
    const totalStallVisits = await prisma.stallVisit.count()
    const totalReportCards = await prisma.reportCard.count({ where: { status: { not: 'PENDING' } } })

    const completedRegs = await prisma.registration.count({ where: { status: 'COMPLETED' } })
    const completionRate = totalRegistrations > 0
      ? Math.round((completedRegs / totalRegistrations) * 100 * 10) / 10
      : 0

    const allRegistrations = await prisma.registration.findMany({
      select: { registeredAt: true, status: true },
      orderBy: { registeredAt: 'asc' },
    })

    const regMap = new Map<string, { participants: number; completed: number }>()
    allRegistrations.forEach(r => {
      const date = r.registeredAt.toISOString().split('T')[0]
      const day = regMap.get(date) || { participants: 0, completed: 0 }
      day.participants++
      if (r.status === 'COMPLETED') day.completed++
      regMap.set(date, day)
    })

    const participationData = Array.from(regMap.entries()).map(([name, vals]) => ({
      name: name.slice(5),
      participants: vals.participants,
      completed: vals.completed,
    }))

    const stalls = await prisma.stall.findMany({
      select: { name: true, _count: { select: { stallVisits: true } } },
    })

    const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#64748b', '#f97316']
    const stallVisitsData = stalls
      .map((s, i) => ({
        name: s.name,
        value: s._count.stallVisits,
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.value - a.value)

    const communities = await prisma.community.findMany({
      include: {
        events: {
          include: {
            _count: { select: { registrations: true } },
            registrations: { select: { status: true } },
          },
        },
      },
    })

    const topCommunities = communities.map(c => {
      const participants = c.events.reduce((sum, e) => sum + e._count.registrations, 0)
      const completed = c.events.reduce(
        (sum, e) => sum + e.registrations.filter(r => r.status === 'COMPLETED').length,
        0
      )
      const rate = participants > 0 ? Math.round((completed / participants) * 100 * 10) / 10 : 0
      return { name: c.name, participants, completed, rate }
    })
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5)

    const recentRegs = await prisma.registration.findMany({
      take: 5,
      orderBy: { registeredAt: 'desc' },
      include: { student: { select: { rollNumber: true } } },
    })

    const recentVisits = await prisma.stallVisit.findMany({
      take: 3,
      orderBy: { visitedAt: 'desc' },
      include: {
        student: { select: { rollNumber: true } },
        stall: { select: { name: true } },
      },
    })

    const recentReports = await prisma.reportCard.findMany({
      take: 2,
      orderBy: { generatedAt: 'desc' },
      where: { status: 'GENERATED' },
      include: { student: { select: { rollNumber: true } } },
    })

    const liveActivities: Array<{
      id: string
      title: string
      roll: string
      time: string
      type: 'register' | 'score' | 'complete' | 'report'
    }> = [
      ...recentRegs.map(r => ({
        id: `reg-${r.id}`,
        title: 'New participant registered',
        roll: r.student.rollNumber,
        time: formatTimeAgo(r.registeredAt),
        type: 'register' as const,
      })),
      ...recentVisits.map(v => ({
        id: `visit-${v.id}`,
        title: `Visited ${v.stall.name}`,
        roll: v.student.rollNumber,
        time: formatTimeAgo(v.visitedAt),
        type: (v.completedAt ? 'complete' : 'score') as 'complete' | 'score',
      })),
      ...recentReports.map(r => ({
        id: `report-${r.id}`,
        title: 'Report card generated',
        roll: r.student.rollNumber,
        time: formatTimeAgo(r.generatedAt!),
        type: 'report' as const,
      })),
    ].slice(0, 6)

    const totalRegistered = totalRegistrations
    const visitedOne = await prisma.stallVisit.groupBy({
      by: ['registrationId'],
      _count: true,
    })
    const visitedOneCount = visitedOne.length
    const visitedThree = visitedOne.filter(v => v._count >= 3).length

    // Get stall count per event (not global) for "visited all" calculation
    const eventsWithStallCount = await prisma.event.findMany({
      select: { id: true, _count: { select: { stalls: true } } }
    })
    const stallCountByEvent = new Map(eventsWithStallCount.map(e => [e.id, e._count.stalls]))

    const regsWithEvents = await prisma.registration.findMany({
      select: { id: true, eventId: true }
    })
    const regEventMap = new Map(regsWithEvents.map(r => [r.id, r.eventId]))

    const visitedAll = await prisma.stallVisit.groupBy({
      by: ['registrationId'],
      _count: true,
    })
    const visitedAllCount = visitedAll.filter(v => {
      const eventId = regEventMap.get(v.registrationId)
      if (!eventId) return false
      const eventStallCount = stallCountByEvent.get(eventId) || 0
      if (eventStallCount === 0) return false
      return v._count >= eventStallCount
    }).length

    const reportsGenerated = totalReportCards

    const funnelData = [
      { label: 'Registered', val: totalRegistered, pct: '100%', color: 'bg-violet-500' },
      { label: 'Visited ≥ 1', val: visitedOneCount, pct: totalRegistered > 0 ? `${Math.round((visitedOneCount / totalRegistered) * 100)}%` : '0%', color: 'bg-blue-500' },
      { label: 'Visited ≥ 3', val: visitedThree, pct: totalRegistered > 0 ? `${Math.round((visitedThree / totalRegistered) * 100)}%` : '0%', color: 'bg-teal-400' },
      { label: 'Visited All', val: visitedAllCount, pct: totalRegistered > 0 ? `${Math.round((visitedAllCount / totalRegistered) * 100)}%` : '0%', color: 'bg-emerald-500' },
      { label: 'Report Generated', val: reportsGenerated, pct: totalRegistered > 0 ? `${Math.round((reportsGenerated / totalRegistered) * 100)}%` : '0%', color: 'bg-orange-400' },
    ]

    const liveEvents = await prisma.event.count({ where: { status: 'LIVE' } })
    const totalVolunteers = await prisma.volunteer.count()
    const totalStalls = await prisma.stall.count()

    return NextResponse.json({
      kpi: { totalRegistrations, totalCommunities, totalStallVisits, totalReportCards, completionRate },
      participationData,
      stallVisitsData,
      topCommunities,
      liveActivities,
      funnelData,
      eventSummary: { liveEvents, totalVolunteers, totalStalls },
    })
  } catch (error) {
    console.error('Dashboard API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} day ago`
}
