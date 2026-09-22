import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// PATCH update application status/notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { status, notes, interviewStage, followUpDate } = body

    const data: any = {}
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes
    if (interviewStage !== undefined) data.interviewStage = interviewStage
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null
    if (status === 'applied' && !body.appliedAt) data.appliedAt = new Date()

    // Verify ownership
    const existing = await prisma.application.findUnique({
      where: { id }
    })
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const application = await prisma.application.update({
      where: { id },
      data,
      include: {
        job: {
          include: {
            company: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
    })

    return NextResponse.json({ application })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE remove application
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const existing = await prisma.application.findUnique({
      where: { id }
    })
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    await prisma.application.delete({
      where: { id },
    })
    return NextResponse.json({ message: 'Application deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
