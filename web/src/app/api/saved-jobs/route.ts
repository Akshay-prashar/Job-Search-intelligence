import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: session.userId },
      include: {
        job: {
          include: {
            company: {
              select: { companyName: true, domain: true, logoUrl: true },
            },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    })

    return NextResponse.json({ savedJobs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
