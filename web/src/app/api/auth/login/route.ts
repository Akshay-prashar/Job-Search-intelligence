import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signJWT } from '@/lib/auth'
import { loginSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request
    const validated = loginSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = validated.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is an admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { email: user.email }
    })

    // Sign JWT
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: adminUser ? 'admin' : 'user'
    })
    
    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: adminUser ? 'admin' : 'user' }
    })
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
