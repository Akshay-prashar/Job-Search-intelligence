import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser, signJWT } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true, currentResume: true }
    })

    const response = NextResponse.json({ user })
    // Refresh cookie with verified userId
    const refreshedToken = await signJWT({ userId: session.userId, email: session.email })
    response.cookies.set('token', refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const body = await req.json()
    const { name, college, branch, graduationYear, cgpa, targetRoles, preferredLocations, preferredWorkMode, headline, bio, githubUrl, linkedinUrl, portfolioUrl, skillsJson } = body
    
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        college,
        branch,
        graduationYear,
        cgpa,
        targetRoles,
        preferredLocations,
        preferredWorkMode,
        profile: {
          update: {
            headline,
            bio,
            githubUrl,
            linkedinUrl,
            portfolioUrl,
            skillsJson
          }
        }
      },
      include: { profile: true }
    })
    
    return NextResponse.json({ user: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
