import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthAdmin } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const admin = await getAuthAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { jobs: true }
        }
      },
      orderBy: { companyName: 'asc' }
    })

    return NextResponse.json({ companies })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAuthAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      companyName,
      domain,
      industry,
      companySize,
      headquartersLocation,
      fresherFriendly,
      cultureTags,
      interviewStyle,
      sourceType
    } = body

    const company = await prisma.company.upsert({
      where: { domain },
      update: {
        companyName,
        industry,
        companySize,
        headquartersLocation,
        fresherFriendly: Boolean(fresherFriendly),
        cultureTagsJson: cultureTags || [],
        interviewStyleJson: interviewStyle || {},
        sourceType: sourceType || 'manual'
      },
      create: {
        companyName,
        domain,
        industry,
        companySize,
        headquartersLocation,
        fresherFriendly: Boolean(fresherFriendly),
        cultureTagsJson: cultureTags || [],
        interviewStyleJson: interviewStyle || {},
        sourceType: sourceType || 'manual'
      }
    })

    return NextResponse.json({ company })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
