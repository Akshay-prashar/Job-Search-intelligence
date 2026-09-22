import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
        currentResume: true,
        applications: {
          include: {
            job: {
              select: {
                jobTitle: true,
                company: { select: { companyName: true } }
              }
            }
          }
        },
        savedJobs: {
          include: {
            job: {
              select: {
                jobTitle: true,
                company: { select: { companyName: true } }
              }
            }
          }
        },
        matches: {
          take: 20,
          include: {
            job: {
              select: {
                jobTitle: true,
                company: { select: { companyName: true } }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log privacy export action
    await prisma.privacyLog.create({
      data: {
        userId: session.userId,
        actionType: 'data_export',
        details: { timestamp: new Date().toISOString() }
      }
    })

    return NextResponse.json({
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
        branch: user.branch,
        graduationYear: user.graduationYear,
        cgpa: user.cgpa,
        targetRoles: user.targetRoles,
        preferredLocations: user.preferredLocations,
        preferredWorkMode: user.preferredWorkMode,
        profile: user.profile,
        resume: user.currentResume ? {
          fileName: user.currentResume.fileName,
          skillsJson: user.currentResume.skillsJson,
          parsedSections: user.currentResume.parsedSections,
          educationJson: user.currentResume.educationJson,
          projectsJson: user.currentResume.projectsJson
        } : null,
        applications: user.applications,
        savedJobs: user.savedJobs,
        recentMatches: user.matches
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error exporting user data' }, { status: 500 })
  }
}
