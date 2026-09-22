import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          where: { jobStatus: 'active' },
          select: {
            id: true,
            jobTitle: true,
            roleType: true,
            location: true,
            remoteType: true,
            experienceLevel: true,
            postedAt: true,
            source: true,
          },
          orderBy: { postedAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ company })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
