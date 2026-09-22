import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signJWT } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request
    const validated = registerSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, email, password, college, branch, graduationYear } = validated.data

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user along with profile profile entry
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        college,
        branch,
        graduationYear,
        profile: {
          create: {
            headline: 'Aspiring Software Engineer',
            bio: 'CS Student looking for internship and entry-level positions.'
          }
        }
      }
    })

    // Sign JWT
    const token = await signJWT({ userId: user.id, email: user.email })
    
    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    )
    
    // Store in cookie for session control
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
