import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const insights = await prisma.companyInsight.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' }
    })

    const hiringNotes = await prisma.hiringNote.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ insights, hiringNotes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching company insights' }, { status: 500 })
  }
}
