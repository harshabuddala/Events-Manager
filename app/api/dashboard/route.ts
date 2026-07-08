import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [totalRegistrations, totalCommunities, totalStallVisits, completedRegs, liveEvents, totalVolunteers, totalStalls] = await Promise.all([
      prisma.registration.count(),
      prisma.community.count(),
      prisma.stallVisit.count(),
      prisma.registration.count({ where: { status: 'COMPLETED' } }),
      prisma.event.count({ where: { status: 'LIVE' } }),
      prisma.volunteer.count(),
      prisma.stall.count(),
    ])

    const totalReportCards = completedRegs
    const completionRate = totalRegistrations > 0
      ? Math.round((completedRegs / totalRegistrations) * 100 * 10) / 10
      : 0

    const participationRaw = await prisma.$queryRaw<{ date: string; participants: bigint; completed: bigint }[]>`
      SELECT 
        TO_CHAR("registeredAt"::date, 'YYYY-MM-DD') as date,
        COUNT(*)::bigint as participants,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)::bigint as completed
      FROM registrations
      GROUP BY "registeredAt"::date
      ORDER BY "registeredAt"::date ASC
    `

    const participationData = participationRaw.map(row => ({
      name: row.date.slice(5),
      participants: Number(row.participants),
      completed: Number(row.completed),
    }))

    const stallVisitsRaw = await prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT s.name, COUNT(sv.id)::bigint as count
      FROM stalls s
      LEFT JOIN stall_visits sv ON sv."stallId" = s.id
      GROUP BY s.id, s.name
      ORDER BY count DESC
    `

    const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#64748b', '#f97316']
    const stallVisitsData = stallVisitsRaw.map((s, i) => ({
      name: s.name,
      value: Number(s.count),
      color: colors[i % colors.length],
    }))

    const topCommunitiesRaw = await prisma.$queryRaw<{ name: string; participants: bigint; completed: bigint }[]>`
      SELECT 
        c.name,
        COUNT(r.id)::bigint as participants,
        SUM(CASE WHEN r.status = 'COMPLETED' THEN 1 ELSE 0 END)::bigint as completed
      FROM communities c
      INNER JOIN events e ON e."communityId" = c.id
      INNER JOIN registrations r ON r."eventId" = e.id
      GROUP BY c.id, c.name
      ORDER BY participants DESC
      LIMIT 5
    `

    const topCommunities = topCommunitiesRaw.map(row => {
      const participants = Number(row.participants)
      const completed = Number(row.completed)
      return {
        name: row.name,
        participants,
        completed,
        rate: participants > 0 ? Math.round((completed / participants) * 100 * 10) / 10 : 0,
      }
    })

    const [recentRegs, recentVisits] = await Promise.all([
      prisma.registration.findMany({
        take: 5,
        orderBy: { registeredAt: 'desc' },
        include: { student: { select: { rollNumber: true } } },
      }),
      prisma.stallVisit.findMany({
        take: 3,
        orderBy: { visitedAt: 'desc' },
        include: {
          student: { select: { rollNumber: true } },
          stall: { select: { name: true } },
        },
      }),
    ])

    const liveActivities: Array<{
      id: string
      title: string
      roll: string
      time: string
      type: 'register' | 'score' | 'complete'
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
    ].slice(0, 6)

    const funnelRaw = await prisma.$queryRaw<{ registration_id: string; visit_count: bigint; event_id: string; stall_count: bigint }[]>`
      SELECT 
        r.id as registration_id,
        COUNT(sv.id)::bigint as visit_count,
        r."eventId" as event_id,
        (SELECT COUNT(*)::bigint FROM "_EventToStall" WHERE "A" = r."eventId") as stall_count
      FROM registrations r
      LEFT JOIN stall_visits sv ON sv."registrationId" = r.id
      GROUP BY r.id, r."eventId"
    `

    let visitedOneCount = 0
    let visitedThreeCount = 0
    let visitedAllCount = 0

    for (const row of funnelRaw) {
      const visits = Number(row.visit_count)
      const stalls = Number(row.stall_count)
      if (visits >= 1) visitedOneCount++
      if (visits >= 3) visitedThreeCount++
      if (stalls > 0 && visits >= stalls) visitedAllCount++
    }

    const funnelData = [
      { label: 'Registered', val: totalRegistrations, pct: '100%', color: 'bg-violet-500' },
      { label: 'Visited ≥ 1', val: visitedOneCount, pct: totalRegistrations > 0 ? `${Math.round((visitedOneCount / totalRegistrations) * 100)}%` : '0%', color: 'bg-blue-500' },
      { label: 'Visited ≥ 3', val: visitedThreeCount, pct: totalRegistrations > 0 ? `${Math.round((visitedThreeCount / totalRegistrations) * 100)}%` : '0%', color: 'bg-teal-400' },
      { label: 'Visited All', val: visitedAllCount, pct: totalRegistrations > 0 ? `${Math.round((visitedAllCount / totalRegistrations) * 100)}%` : '0%', color: 'bg-emerald-500' },
      { label: 'Registration Completed', val: totalReportCards, pct: totalRegistrations > 0 ? `${Math.round((totalReportCards / totalRegistrations) * 100)}%` : '0%', color: 'bg-orange-400' },
    ]

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
