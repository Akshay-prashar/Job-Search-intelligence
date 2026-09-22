import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'

const BACKEND_URL = process.env.BACKEND_URL || process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
const API_KEY = process.env.INTERNAL_API_KEY || process.env.PYTHON_API_KEY || 'internal-secret-key'

export async function POST(req: NextRequest) {
  const admin = await getAuthAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const res = await fetch(`${BACKEND_URL}/ingestion/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Ingestion trigger failed on backend microservice' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error triggering ingestion' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const admin = await getAuthAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/ingestion/status`, {
      headers: {
        'X-API-KEY': API_KEY,
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to retrieve ingestion status' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error checking ingestion status' }, { status: 500 })
  }
}
