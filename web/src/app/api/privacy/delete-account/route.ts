import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function DELETE(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Delete in dependency order
    await prisma.$transaction([
      prisma.jobMatch.deleteMany({ where: { userId: session.userId } }),
      prisma.application.deleteMany({ where: { userId: session.userId } }),
      prisma.savedJob.deleteMany({ where: { userId: session.userId } }),
      prisma.userProfile.deleteMany({ where: { userId: session.userId } }),
      prisma.resume.deleteMany({ where: { userId: session.userId } }),
      prisma.user.delete({ where: { id: session.userId } }),
    ])

    // Clear auth cookie
    const response = NextResponse.json({ message: 'Account deleted successfully' })
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 })
  }
}
