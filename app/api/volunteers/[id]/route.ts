import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  phoneNumber: z.string().max(30).optional().or(z.literal('')),
  role: z.enum(['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR']).optional(),
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'ON_LEAVE']).optional(),
  preferredStall: z.string().max(100).optional().or(z.literal('')),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { id: params.id },
    })

    if (!volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
    }

    return NextResponse.json({ volunteer })
  } catch (error) {
    console.error('Get volunteer error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = await readJsonBody(request, updateSchema)
    if (!parsed.ok) return parsed.response
    const result = parsed.data

    // Check if volunteer exists
    const existing = await prisma.volunteer.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
    }

    // Check email uniqueness if email is being updated
    if (result.email && result.email !== existing.email) {
      const emailExists = await prisma.volunteer.findUnique({
        where: { email: result.email },
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined
    if (result.password) {
      hashedPassword = await hash(result.password, 12)
    }

    // Update volunteer
    const volunteer = await prisma.volunteer.update({
      where: { id: params.id },
      data: {
        ...(result.name && { name: result.name }),
        ...(result.email && { email: result.email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(result.phoneNumber !== undefined && { phoneNumber: result.phoneNumber || null }),
        ...(result.role && { role: result.role }),
        ...(result.status && { status: result.status }),
        ...(result.preferredStall !== undefined && { preferredStall: result.preferredStall || null }),
      },
    })

    return NextResponse.json({ volunteer })
  } catch (error) {
    console.error('Update volunteer error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if volunteer exists
    const existing = await prisma.volunteer.findUnique({
      where: { id: params.id },
      include: {
        assignments: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
    }

    // Check if volunteer has active assignments
    if (existing.assignments.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete volunteer with active assignments. Please reassign them first.' 
      }, { status: 400 })
    }

    // Delete volunteer
    await prisma.volunteer.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete volunteer error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}