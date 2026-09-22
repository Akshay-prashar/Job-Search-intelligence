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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthAdmin(req)
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { sourceName, sourceType, sourceUrl, active, fetchFrequency, trustLevel } = body

    const data: any = {}
    if (sourceName !== undefined) data.sourceName = sourceName
    if (sourceType !== undefined) data.sourceType = sourceType
    if (sourceUrl !== undefined) data.sourceUrl = sourceUrl
    if (active !== undefined) data.active = Boolean(active)
    if (fetchFrequency !== undefined) data.fetchFrequency = fetchFrequency
    if (trustLevel !== undefined) data.trustLevel = trustLevel

    const updated = await prisma.sourceFeed.update({
      where: { id },
      data,
    })

    return NextResponse.json({ source: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthAdmin(req)
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    // Deactivate rather than hard delete to preserve foreign key history
    const deactivated = await prisma.sourceFeed.update({
      where: { id },
      data: { active: false }
    })

    return NextResponse.json({ message: 'Source deactivated successfully', source: deactivated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
