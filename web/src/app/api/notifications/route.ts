import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 30
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: session.userId, readStatus: false }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching notifications' }, { status: 500 })
  }
}
