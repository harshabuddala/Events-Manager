import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const importSchema = z.object({
  rows: z.array(z.array(z.any())),
  nameColumn: z.number().int().min(0),
  emailColumn: z.number().int().min(0),
  passwordColumn: z.number().int().min(0).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const result = importSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { rows, nameColumn, emailColumn, passwordColumn } = result.data

    if (!rows.length) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!Array.isArray(row) || row.every((cell: any) => !String(cell).trim())) continue

      const name = String(row[nameColumn] || '').trim()
      const email = String(row[emailColumn] || '').trim()
      const passwordRaw = passwordColumn !== undefined ? String(row[passwordColumn] || '').trim() : ''

      if (!name || !email) {
        results.failed++
        results.errors.push(`Row ${i + 1}: missing name or email`)
        continue
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        results.failed++
        results.errors.push(`Row ${i + 1}: invalid email "${email}"`)
        continue
      }

      const existing = await prisma.volunteer.findUnique({ where: { email } })
      if (existing) {
        results.skipped++
        continue
      }

      const password = passwordRaw || `Vol${Math.random().toString(36).slice(2, 8)}!`

      try {
        const hashedPassword = await hash(password, 12)
        await prisma.volunteer.create({
          data: {
            name,
            email,
            password: hashedPassword,
            status: 'AVAILABLE',
            role: 'VOLUNTEER',
          },
        })
        results.created++
      } catch (err: any) {
        results.failed++
        results.errors.push(`Row ${i + 1}: ${err.message || 'Database error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        created: results.created,
        skipped: results.skipped,
        failed: results.failed,
      },
      errors: results.errors.slice(0, 20),
    })
  } catch (error) {
    console.error('Import volunteers error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
