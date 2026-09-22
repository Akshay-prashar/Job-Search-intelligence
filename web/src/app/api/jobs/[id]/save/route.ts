import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: jobId } = await params
    const existing = await prisma.savedJob.findUnique({
      where: { userId_jobId: { userId: session.userId, jobId } },
    })

    if (existing) {
      // Unsave
      await prisma.savedJob.delete({ where: { id: existing.id } })
      return NextResponse.json({ saved: false, message: 'Job unsaved' })
    }

    // Save
    const saved = await prisma.savedJob.create({
      data: { userId: session.userId, jobId },
    })
    return NextResponse.json({ saved: true, savedJob: saved }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
