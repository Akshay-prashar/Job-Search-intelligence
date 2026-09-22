import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET all applications for the current user
export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const applications = await prisma.application.findMany({
      where: { userId: session.userId },
      include: {
        job: {
          include: {
            company: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ applications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new application
export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { jobId, status = 'to_apply', notes } = await req.json()

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const application = await prisma.application.create({
      data: {
        userId: session.userId,
        jobId,
        status,
        notes,
        appliedAt: status === 'applied' ? new Date() : null,
      },
      include: {
        job: {
          include: {
            company: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
    })

    return NextResponse.json({ application }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Application already exists for this job' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
