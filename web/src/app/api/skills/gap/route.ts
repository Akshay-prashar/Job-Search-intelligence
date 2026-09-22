import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's skills from profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.userId },
      select: { skillsJson: true },
    })

    const userSkills: string[] = Array.isArray(userProfile?.skillsJson)
      ? (userProfile.skillsJson as any[]).map((s: any) =>
          typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()
        )
      : []

    // Get skills from matched/recommended jobs
    const recentJobs = await prisma.job.findMany({
      where: { jobStatus: 'active' },
      select: { skillsJson: true },
      take: 100,
      orderBy: { postedAt: 'desc' },
    })

    // Count frequency of each skill across jobs
    const skillFrequency: Record<string, number> = {}
    let totalJobs = 0

    for (const job of recentJobs) {
      if (Array.isArray(job.skillsJson)) {
        totalJobs++
        for (const skill of job.skillsJson as string[]) {
          const normalized = skill.toLowerCase()
          skillFrequency[normalized] = (skillFrequency[normalized] || 0) + 1
        }
      }
    }

    // Find gaps: skills appearing in jobs but not in user's profile
    const gaps = Object.entries(skillFrequency)
      .filter(([skill]) => !userSkills.includes(skill))
      .map(([skill, count]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        frequency: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
        count,
        level: count / totalJobs > 0.5 ? 'high' : count / totalJobs > 0.3 ? 'medium' : 'low',
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15)

    return NextResponse.json({
      userSkills: userSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
      gaps,
      totalJobsAnalyzed: totalJobs,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
