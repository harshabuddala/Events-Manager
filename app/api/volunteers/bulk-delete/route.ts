import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const ADMIN_UUID = '00000000-0000-0000-0000-000000000001'

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const result = bulkDeleteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { ids } = result.data

    // Never delete the admin account
    const safeIds = ids.filter((id) => id !== ADMIN_UUID)
    const adminSkipped = ids.length - safeIds.length

    if (safeIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid volunteers to delete (admin account protected)' },
        { status: 400 }
      )
    }

    const deleted = await prisma.$transaction(async (tx) => {
      // Delete related performances first
      await tx.performance.deleteMany({
        where: { volunteerId: { in: safeIds } },
      })

      // Delete related assignments
      await tx.volunteerAssignment.deleteMany({
        where: { volunteerId: { in: safeIds } },
      })

      // Delete volunteers
      const { count } = await tx.volunteer.deleteMany({
        where: { id: { in: safeIds } },
      })

      return count
    })

    return NextResponse.json({
      success: true,
      deleted,
      adminSkipped: adminSkipped > 0 ? adminSkipped : undefined,
    })
  } catch (error) {
    console.error('Bulk delete volunteers error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
