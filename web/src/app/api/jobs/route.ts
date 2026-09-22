import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const roleType = searchParams.get('roleType')
    const experienceLevel = searchParams.get('experienceLevel')
    const remoteType = searchParams.get('remoteType')
    const source = searchParams.get('source')
    const sortBy = searchParams.get('sortBy') || 'newest'

    const where: any = { jobStatus: 'active' }

    if (search) {
      where.OR = [
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { companyName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (roleType) {
      where.roleType = { in: roleType.split(',') }
    }
    if (experienceLevel) {
      where.experienceLevel = { in: experienceLevel.split(',') }
    }
    if (remoteType) {
      where.remoteType = { in: remoteType.split(',') }
    }
    if (source) {
      where.source = { in: source.split(',') }
    }

    const orderBy: any = sortBy === 'newest'
      ? { postedAt: 'desc' }
      : sortBy === 'company'
      ? { company: { companyName: 'asc' } }
      : { createdAt: 'desc' }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: { select: { companyName: true, domain: true, logoUrl: true, fresherFriendly: true } },
          requirements: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch jobs' }, { status: 500 })
  }
}
