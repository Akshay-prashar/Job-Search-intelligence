import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

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
    const updated = await prisma.notification.update({
      where: { id, userId: session.userId },
      data: { readStatus: true }
    })

    return NextResponse.json({ notification: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating notification' }, { status: 500 })
  }
}
