import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        currentResume: {
          include: {
            taxonomyLinks: {
              include: {
                taxonomyTerm: true
              }
            }
          }
        }
      }
    })

    if (!user || !user.currentResume) {
      return NextResponse.json({ resume: null })
    }

    return NextResponse.json({ resume: user.currentResume })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching resume' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    })

    if (!user || !user.resumeId) {
      return NextResponse.json({ message: 'No active resume found' })
    }

    const resumeId = user.resumeId

    // 1. Unlink currentResume from user
    await prisma.user.update({
      where: { id: session.userId },
      data: { resumeId: null }
    })

    // 2. Delete resume taxonomy links
    await prisma.resumeTaxonomyLink.deleteMany({
      where: { resumeId: resumeId }
    })

    // 3. Delete resume record
    await prisma.resume.delete({
      where: { id: resumeId }
    })

    return NextResponse.json({ message: 'Resume deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error deleting resume' }, { status: 500 })
  }
}
