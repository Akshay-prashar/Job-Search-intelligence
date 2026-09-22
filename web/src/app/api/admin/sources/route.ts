import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'

async function getAuthAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  if (!token) return null
  const payload = await verifyJWT(token)
  if (!payload) return null
  // Check if user exists in admin_users table
  const adminUser = await prisma.adminUser.findUnique({
    where: { email: payload.email },
  })
  if (!adminUser) return null
  return payload
}

// GET all source feeds
export async function GET(req: NextRequest) {
  const session = await getAuthAdmin(req)
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const sources = await prisma.sourceFeed.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rawIngestions: true } },
      },
    })

    return NextResponse.json({ sources })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new source feed
export async function POST(req: NextRequest) {
  const session = await getAuthAdmin(req)
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { sourceName, sourceType, sourceUrl, active = true, fetchFrequency = 'daily' } = body

    if (!sourceType || !sourceName) {
      return NextResponse.json({ error: 'sourceName and sourceType are required' }, { status: 400 })
    }

    const source = await prisma.sourceFeed.create({
      data: {
        sourceName,
        sourceType,
        sourceUrl: sourceUrl || '',
        active,
        fetchFrequency,
      },
    })

    return NextResponse.json({ source }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
