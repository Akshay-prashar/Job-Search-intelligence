import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'supersecretjwttokendesignchangeinproduction'
)

export async function signJWT(payload: { userId: string; email: string; role?: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string; role?: string }
  } catch (error) {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<{ userId: string; email: string; name?: string } | null> {
  const token = req.cookies.get('token')?.value
  if (!token) return null

  const payload = await verifyJWT(token)
  if (!payload || (!payload.userId && !payload.email)) return null

  try {
    // 1. Verify user exists in the active database by ID
    if (payload.userId) {
      const userById = await prisma.user.findUnique({
        where: { id: payload.userId }
      })
      if (userById) {
        return { userId: userById.id, email: userById.email, name: userById.name }
      }
    }

    // 2. If ID mismatch (e.g. database was recreated/reseedeed), resolve by email
    if (payload.email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: payload.email }
      })
      if (userByEmail) {
        return { userId: userByEmail.id, email: userByEmail.email, name: userByEmail.name }
      }

      // 3. If admin account, ensure user record exists for relational integrity
      const admin = await prisma.adminUser.findUnique({
        where: { email: payload.email }
      })
      if (admin) {
        const createdUser = await prisma.user.upsert({
          where: { email: admin.email },
          update: {},
          create: {
            name: admin.name,
            email: admin.email,
            passwordHash: admin.passwordHash,
            targetRoles: ['admin', 'fullstack'],
            preferredWorkMode: 'remote'
          }
        })
        return { userId: createdUser.id, email: createdUser.email, name: createdUser.name }
      }
    }

    return null
  } catch (err) {
    console.error('Error in getAuthUser database verification:', err)
    return null
  }
}
