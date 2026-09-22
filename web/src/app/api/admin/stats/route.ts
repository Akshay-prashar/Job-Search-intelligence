import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

async function getAuthAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null
  const payload = await verifyJWT(token)
  if (!payload) return null
  const adminUser = await prisma.adminUser.findUnique({
    where: { email: payload.email },
  })
  if (!adminUser) return null
  return payload
}

export async function GET(req: NextRequest) {
  const session = await getAuthAdmin(req)
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [
      totalUsers,
      totalJobs,
      activeJobs,
      totalCompanies,
      totalApplications,
      totalResumes,
      totalTaxonomyTerms,
      totalJobTaxonomyLinks,
      totalResumeTaxonomyLinks,
      totalMatchesComputed,
      recentJobs,
      sourceCounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.job.count({ where: { jobStatus: 'active' } }),
      prisma.company.count(),
      prisma.application.count(),
      prisma.resume.count(),
      prisma.taxonomyTerm.count(),
      prisma.jobTaxonomyLink.count(),
      prisma.resumeTaxonomyLink.count(),
      prisma.jobMatch.count(),
      prisma.job.findMany({
        select: { id: true, jobTitle: true, source: true, createdAt: true, company: { select: { companyName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.job.groupBy({
        by: ['source'],
        _count: { id: true },
        where: { jobStatus: 'active' },
      }),
    ])

    return NextResponse.json({
      stats: {
        totalUsers,
        totalJobs,
        activeJobs,
        expiredJobs: totalJobs - activeJobs,
        totalCompanies,
        totalApplications,
        totalResumes,
        totalTaxonomyTerms,
        totalJobTaxonomyLinks,
        totalResumeTaxonomyLinks,
        totalMatchesComputed,
      },
      recentJobs,
      sourceCounts: sourceCounts.map(s => ({
        source: s.source,
        count: s._count.id,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
